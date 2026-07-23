<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Enums\DeviceApprovalStatus;
use App\Jobs\DispatchDeviceCollection;
use App\Jobs\RunDeviceDiagnostic;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Models\Organization;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CollectionOrchestrator
{
    /** @return array{scheduled:int,dispatched:int} */
    public function tick(): array
    {
        return Cache::lock('netkeep:collection-orchestrator', 55)->get(function (): array {
            $this->recoverStaleRuns();
            $scheduled = $this->scheduleDueDevices();
            $dispatched = $this->dispatchQueuedRuns();

            return compact('scheduled', 'dispatched');
        }) ?? ['scheduled' => 0, 'dispatched' => 0];
    }

    private function scheduleDueDevices(): int
    {
        $count = 0;

        Device::query()
            ->where('enabled', true)
            ->where('approval_status', DeviceApprovalStatus::Approved)
            ->where(fn ($query) => $query
                ->whereNull('next_collection_at')
                ->orWhere('next_collection_at', '<=', now()))
            ->orderBy('id')
            ->chunkById(250, function ($devices) use (&$count): void {
                foreach ($devices as $device) {
                    try {
                        app(CollectionRequestService::class)->request($device, CollectionTrigger::Scheduled);
                        $count++;
                    } catch (\Throwable) {
                        continue;
                    }

                    $jitter = random_int(0, max(1, (int) floor($device->backup_interval * 0.1)));
                    $device->forceFill([
                        'next_collection_at' => now()->addSeconds($device->backup_interval + $jitter),
                    ])->save();
                }
            });

        return $count;
    }

    private function dispatchQueuedRuns(): int
    {
        $limit = $this->globalLimit();
        $siteLimit = max(1, min(2, (int) config('netkeep.collections.site_concurrency', 2)));
        /** @var list<int> $dispatched */
        $dispatched = [];

        DB::transaction(function () use ($limit, $siteLimit, &$dispatched): void {
            $active = CollectionRun::query()
                ->whereIn('status', [CollectionRunStatus::Dispatched, CollectionRunStatus::Running])
                ->count();
            $available = max(0, $limit - $active);
            if ($available === 0) {
                return;
            }

            $runs = CollectionRun::query()
                ->whereIn('status', [CollectionRunStatus::Queued, CollectionRunStatus::Cooldown])
                ->where('scheduled_for', '<=', now())
                ->with('device:id,site_id')
                ->orderByDesc('priority')
                ->orderBy('scheduled_for')
                ->lockForUpdate()
                ->limit($available * 4)
                ->get();
            /** @var array<string, int> $siteCounts */
            $siteCounts = [];
            $activeRuns = CollectionRun::query()
                ->join('devices', 'devices.id', '=', 'collection_runs.device_id')
                ->whereIn('collection_runs.status', [CollectionRunStatus::Dispatched, CollectionRunStatus::Running])
                ->toBase()
                ->get(['devices.id AS device_id', 'devices.site_id']);
            foreach ($activeRuns as $activeRun) {
                $siteId = data_get($activeRun, 'site_id');
                $key = $siteId === null
                    ? 'device-'.(int) data_get($activeRun, 'device_id')
                    : 'site-'.(int) $siteId;
                $siteCounts[$key] = ($siteCounts[$key] ?? 0) + 1;
            }

            foreach ($runs as $run) {
                if (count($dispatched) >= $available) {
                    break;
                }

                $siteKey = $run->device->site_id === null
                    ? 'device-'.$run->device->id
                    : 'site-'.$run->device->site_id;
                if ((int) ($siteCounts[$siteKey] ?? 0) >= $siteLimit) {
                    continue;
                }

                $run->update([
                    'status' => CollectionRunStatus::Dispatched,
                    'dispatched_at' => now(),
                    'cooldown_until' => null,
                ]);
                app(CollectionRunEventService::class)->record($run, 'dispatched');
                $siteCounts[$siteKey] = (int) ($siteCounts[$siteKey] ?? 0) + 1;
                $dispatched[] = $run->id;
            }
        });

        foreach ($dispatched as $runId) {
            $run = CollectionRun::query()->find($runId);
            if ($run?->trigger === CollectionTrigger::Diagnostic) {
                RunDeviceDiagnostic::dispatch($runId);
            } else {
                DispatchDeviceCollection::dispatch($runId);
            }
        }

        return count($dispatched);
    }

    private function recoverStaleRuns(): void
    {
        CollectionRun::query()
            ->where('status', CollectionRunStatus::Dispatched)
            ->where('dispatched_at', '<=', now()->subMinutes(2))
            ->update([
                'status' => CollectionRunStatus::Queued,
                'dispatched_at' => null,
                'updated_at' => now(),
            ]);

        CollectionRun::query()
            ->where('status', CollectionRunStatus::Running)
            ->where('started_at', '<=', now()->subMinute())
            ->with('device')
            ->chunkById(100, function ($runs): void {
                foreach ($runs as $run) {
                    $deadline = $run->started_at?->addSeconds($run->device->timeout + 60);
                    if ($deadline?->isPast()) {
                        app(CollectionRunService::class)->fail($run, 'collection_timelimit');
                    }
                }
            });
    }

    private function globalLimit(): int
    {
        $settings = Organization::query()->value('settings') ?? [];
        $configured = (int) ($settings['collection_concurrency'] ?? config('netkeep.collections.concurrency', 5));

        return max(1, min((int) config('netkeep.collections.max_concurrency', 20), $configured));
    }
}
