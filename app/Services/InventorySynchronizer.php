<?php

namespace App\Services;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Models\Device;
use App\Models\InventorySource;
use App\Models\Site;
use App\Models\Tag;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventorySynchronizer
{
    public function __construct(private readonly SafeHttpClient $http) {}

    /**
     * @return array{created:int,updated:int,disabled:int}
     */
    public function sync(InventorySource $source): array
    {
        $lock = Cache::lock("netkeep:inventory-source:{$source->id}", 1800);
        if (! $lock->get()) {
            throw new \RuntimeException('inventory_sync_already_running');
        }

        try {
            return $this->syncLocked($source);
        } finally {
            $lock->release();
        }
    }

    /** @return array{created:int,updated:int,disabled:int} */
    private function syncLocked(InventorySource $source): array
    {
        $seen = [];
        $created = 0;
        $updated = 0;

        foreach ($this->fetch($source) as $external) {
            $externalId = (string) $external['id'];
            $seen[] = $externalId;

            DB::transaction(function () use ($source, $external, $externalId, &$created, &$updated): void {
                $site = empty($external['site'])
                    ? null
                    : Site::query()->firstOrCreate(['name' => (string) $external['site']]);

                $device = Device::withTrashed()->firstOrNew([
                    'inventory_source_id' => $source->id,
                    'external_id' => $externalId,
                ]);
                $isNew = ! $device->exists;
                $isNew ? $created++ : $updated++;
                $duplicate = Device::query()
                    ->where('ip_address', (string) $external['ip'])
                    ->when($device->exists, fn ($query) => $query->whereKeyNot($device->id))
                    ->first(['id', 'name']);
                $conflict = $duplicate
                    ? "IP já pertence ao equipamento {$duplicate->name} (#{$duplicate->id})."
                    : null;
                $device->fill([
                    'name' => (string) $external['name'],
                    'hostname' => $external['hostname'] ?: null,
                    'ip_address' => (string) $external['ip'],
                    'manufacturer' => $external['manufacturer'] ?: null,
                    'hardware_model' => $external['hardware_model'] ?: null,
                    'site_id' => $site?->id,
                    'conflict_reason' => $conflict,
                    'oxidized_model' => $device->oxidized_model ?: 'generic',
                    'external_missing_since' => null,
                ]);
                $sensitiveChanged = $isNew || $device->isDirty(['hostname', 'ip_address']);
                if ($sensitiveChanged || $conflict !== null) {
                    $device->forceFill([
                        'enabled' => false,
                        'status' => $conflict ? DeviceStatus::Conflict : DeviceStatus::Pending,
                        'approval_status' => DeviceApprovalStatus::Pending,
                        'approval_fingerprint' => null,
                        'approved_by' => null,
                        'approved_at' => null,
                        'approved_resolved_addresses' => null,
                        'next_collection_at' => null,
                    ]);
                } elseif (! $external['enabled']) {
                    $device->forceFill(['enabled' => false, 'status' => DeviceStatus::Disabled]);
                } elseif ($device->approval_status === DeviceApprovalStatus::Approved) {
                    $device->forceFill(['enabled' => true, 'status' => DeviceStatus::Pending]);
                } else {
                    $device->forceFill(['enabled' => false, 'status' => DeviceStatus::Pending]);
                }
                $device->deleted_at = null;
                $device->save();

                $tagIds = collect((array) ($external['tags'] ?? []))
                    ->filter()
                    ->map(fn (mixed $tag): int => Tag::query()->firstOrCreate(['name' => (string) $tag])->id);
                $device->tags()->syncWithoutDetaching($tagIds);
            });
        }

        $missing = Device::query()->where('inventory_source_id', $source->id);
        if ($seen !== []) {
            $missing->whereNotIn('external_id', $seen);
        }
        $missing->whereNull('external_missing_since')->update(['external_missing_since' => now()]);

        $gracePeriod = max(300, (int) ($source->settings['grace_period'] ?? 86400));
        $disabled = Device::query()
            ->where('inventory_source_id', $source->id)
            ->whereNotNull('external_missing_since')
            ->where('external_missing_since', '<=', now()->subSeconds($gracePeriod))
            ->where('enabled', true)
            ->update(['enabled' => false, 'status' => DeviceStatus::Disabled->value]);

        $source->update(['last_synced_at' => now(), 'last_error' => null]);

        return compact('created', 'updated', 'disabled');
    }

    /**
     * @return iterable<int, array<string, mixed>>
     */
    private function fetch(InventorySource $source): iterable
    {
        return match ($source->type) {
            'librenms' => $this->fetchLibreNms($source),
            'netbox' => $this->fetchNetBox($source),
            default => throw new \InvalidArgumentException('Fonte de inventário não suportada.'),
        };
    }

    /**
     * @return iterable<int, array<string, mixed>>
     */
    private function fetchLibreNms(InventorySource $source): iterable
    {
        $offset = 0;
        $seen = [];
        $pages = 0;
        $records = 0;

        do {
            if (++$pages > 1000) {
                throw new \RuntimeException('inventory_page_limit_exceeded');
            }
            $response = $this->client($source)
                ->withHeader('X-Auth-Token', $source->token)
                ->get('/api/v0/devices', ['limit' => 500, 'offset' => $offset]);
            $this->http->assertResponseSize($response);
            $response->throw();
            $devices = (array) $response->json('devices', []);
            $newOnPage = 0;

            foreach ($devices as $device) {
                $id = (string) $device['device_id'];
                if (isset($seen[$id])) {
                    continue;
                }
                $seen[$id] = true;
                $newOnPage++;
                if (++$records > 50000) {
                    throw new \RuntimeException('inventory_record_limit_exceeded');
                }
                yield [
                    'id' => $id,
                    'name' => $device['sysName'] ?: $device['hostname'],
                    'hostname' => $device['hostname'],
                    'ip' => $device['ip'] ?: $device['hostname'],
                    'site' => $device['location'] ?? null,
                    'manufacturer' => $device['vendor'] ?? null,
                    'hardware_model' => $device['hardware'] ?? null,
                    'enabled' => ($device['disabled'] ?? 0) === 0,
                    'tags' => array_filter([$device['type'] ?? null, $device['os'] ?? null]),
                ];
            }
            $offset += count($devices);
        } while (count($devices) === 500 && $newOnPage > 0);
    }

    private function netBoxNextUrl(InventorySource $source, string $next): ?string
    {
        $base = parse_url(rtrim($source->base_url, '/'));
        $candidate = parse_url($next);
        if (! is_array($base) || ! is_array($candidate)
            || strtolower((string) ($base['scheme'] ?? '')) !== strtolower((string) ($candidate['scheme'] ?? ''))
            || strtolower((string) ($base['host'] ?? '')) !== strtolower((string) ($candidate['host'] ?? ''))
            || ($base['port'] ?? null) !== ($candidate['port'] ?? null)) {
            throw new \RuntimeException('A paginação do NetBox apontou para uma origem diferente.');
        }

        $path = (string) ($candidate['path'] ?? '');
        $query = isset($candidate['query']) ? '?'.$candidate['query'] : '';

        return $path !== '' ? $path.$query : null;
    }

    /**
     * @return iterable<int, array<string, mixed>>
     */
    private function fetchNetBox(InventorySource $source): iterable
    {
        $url = '/api/dcim/devices/?limit=200';
        $seenPages = [];
        $pages = 0;
        $records = 0;

        while ($url) {
            if (isset($seenPages[$url]) || ++$pages > 1000) {
                throw new \RuntimeException('inventory_pagination_cycle');
            }
            $seenPages[$url] = true;
            $response = $this->client($source)->withToken($source->token, 'Token')->get($url);
            $this->http->assertResponseSize($response);
            $response->throw();

            foreach ((array) $response->json('results', []) as $device) {
                if (++$records > 50000) {
                    throw new \RuntimeException('inventory_record_limit_exceeded');
                }
                $primary = $device['primary_ip4']['address'] ?? $device['primary_ip']['address'] ?? null;
                yield [
                    'id' => $device['id'],
                    'name' => $device['name'] ?: 'netbox-'.$device['id'],
                    'hostname' => $device['name'] ?? null,
                    'ip' => $primary ? Str::before($primary, '/') : ($device['name'] ?? ''),
                    'site' => $device['site']['name'] ?? null,
                    'manufacturer' => $device['device_type']['manufacturer']['name'] ?? null,
                    'hardware_model' => $device['device_type']['model'] ?? null,
                    'enabled' => ($device['status']['value'] ?? '') === 'active',
                    'tags' => collect((array) ($device['tags'] ?? []))->pluck('name')->all(),
                ];
            }

            $next = $response->json('next');
            $url = is_string($next) ? $this->netBoxNextUrl($source, $next) : null;
        }
    }

    private function client(InventorySource $source): PendingRequest
    {
        return $this->http->baseUrl($source->base_url)
            ->acceptJson()
            ->retry(2, 500);
    }
}
