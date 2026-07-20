<?php

namespace App\Http\Controllers;

use App\Enums\CollectionTrigger;
use App\Enums\DangerousFeature;
use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\SupportedLocale;
use App\Models\CredentialProfile;
use App\Models\CustomModel;
use App\Models\Device;
use App\Models\DeviceGroup;
use App\Models\HardwareModel;
use App\Models\Manufacturer;
use App\Models\Organization;
use App\Models\Site;
use App\Models\Tag;
use App\Services\AuditLogger;
use App\Services\CollectionRequestService;
use App\Services\DangerousFeatureService;
use App\Services\DeviceApprovalService;
use App\Services\KnownHostsWriter;
use App\Services\NetworkTargetGuard;
use App\Services\OxidizedClient;
use App\Services\SshHostKeyScanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DeviceController extends Controller
{
    private const CSV_HEADERS = [
        'name',
        'hostname',
        'ip_address',
        'port',
        'transport',
        'manufacturer',
        'hardware_model',
        'oxidized_model',
        'group',
        'site',
        'enabled',
    ];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search'));
        $devices = Device::query()
            ->with(['group:id,name', 'site:id,name', 'tags:id,name,color', 'credentials:id,name'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'ilike', "%{$search}%")
                    ->orWhere('ip_address', 'ilike', "%{$search}%")
                    ->orWhere('hostname', 'ilike', "%{$search}%");
            }))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('devices/index', [
            'devices' => $devices,
            'filters' => ['search' => $search],
            'options' => $this->options(),
            'canManage' => $request->user()->role->canManageInventory(),
            'canApprove' => $request->user()->role->canManageSystem(),
        ]);
    }

    public function edit(Device $device, Request $request): Response
    {
        return Inertia::render('devices/edit', [
            'device' => [
                ...$device->only([
                    'id', 'name', 'hostname', 'ip_address', 'port', 'transport',
                    'manufacturer', 'hardware_model', 'oxidized_model', 'site_id',
                    'device_group_id', 'credential_profile_id', 'username_override',
                    'backup_interval', 'timeout', 'enabled', 'remove_secrets',
                    'approval_status', 'approved_at', 'ssh_host_key_fingerprint',
                    'last_backup_at', 'next_collection_at', 'manual_cooldown_until',
                ]),
                'tags' => $device->tags()->orderBy('name')->pluck('name'),
                'has_password_override' => filled($device->password_override),
                'has_enable_secret_override' => filled($device->enable_secret_override),
            ],
            'options' => $this->options(),
            'canManage' => $request->user()->role->canManageInventory(),
            'canApprove' => $request->user()->role->canManageSystem(),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $device = DB::transaction(function () use ($request): Device {
            $data = $this->validated($request);
            $tags = $data['tags'] ?? [];
            unset($data['tags']);

            $device = Device::query()->create($data + [
                'status' => DeviceStatus::Pending,
                'approval_status' => DeviceApprovalStatus::Pending,
                'enabled' => false,
            ]);
            $device->tags()->sync($this->tagIds($tags));

            return $device;
        });

        $audit->record('device.created', $device, ['name' => $device->name, 'ip_address' => $device->ip_address]);

        return back()->with('success', __('netkeep.devices.created'));
    }

    public function update(
        Request $request,
        Device $device,
        AuditLogger $audit,
        DeviceApprovalService $approval,
        OxidizedClient $oxidized,
    ): RedirectResponse {
        $invalidated = false;
        DB::transaction(function () use ($request, $device, $approval, &$invalidated): void {
            $data = $this->validated($request, $device);
            $tags = $data['tags'] ?? [];
            unset($data['tags']);

            foreach (['password_override', 'enable_secret_override'] as $secret) {
                if (($data[$secret] ?? '') === '') {
                    unset($data[$secret]);
                }
            }

            $invalidated = $approval->hasSensitiveChanges($device, $data);
            unset($data['enabled']);
            $device->update($data);
            $device->tags()->sync($this->tagIds($tags));
            if ($invalidated) {
                $approval->invalidate($device);
            }
        });

        $audit->record('device.updated', $device, ['fields' => array_keys($request->except(['password_override', 'enable_secret_override']))]);
        if ($invalidated) {
            $audit->record('device.approval_invalidated', $device, ['reason' => 'sensitive_fields_changed']);
            $oxidized->reload();
        }

        return back()->with('success', __('netkeep.devices.updated'));
    }

    public function destroy(Device $device, AuditLogger $audit, OxidizedClient $oxidized): RedirectResponse
    {
        $device->update(['enabled' => false, 'status' => DeviceStatus::Disabled]);
        $device->delete();
        $audit->record('device.deleted', $device, ['history_preserved' => true]);
        $oxidized->reload();

        return back()->with('success', __('netkeep.devices.deleted'));
    }

    public function collect(
        Request $request,
        Device $device,
        CollectionRequestService $collections,
        AuditLogger $audit,
    ): RedirectResponse {
        $force = $request->boolean('force');
        if ($force) {
            abort_unless($request->user()->role->canManageSystem(), 403);
            abort_unless(
                (int) $request->session()->get('auth.password_confirmed_at', 0) >= now()->subMinutes(5)->timestamp,
                423,
            );
            $request->validate(['risk_confirmation' => ['required', Rule::in(['FORCE'])]]);
        }

        $run = $collections->request(
            $device,
            CollectionTrigger::Manual,
            $request->user(),
            $force,
        );
        $audit->record('device.collection_requested', $device, [
            'collection_run_uuid' => $run->uuid,
            'force' => $force,
        ]);

        return back()->with('success', __('netkeep.devices.collection_queued'));
    }

    public function forceCollect(
        Request $request,
        Device $device,
        CollectionRequestService $collections,
        AuditLogger $audit,
    ): RedirectResponse {
        abort_unless(
            (int) $request->session()->get('auth.password_confirmed_at', 0) >= now()->subMinutes(5)->timestamp,
            423,
        );
        $request->validate(['risk_confirmation' => ['required', Rule::in(['FORCE'])]]);
        $run = $collections->request(
            $device,
            CollectionTrigger::Manual,
            $request->user(),
            true,
        );
        $audit->record('device.collection_requested', $device, [
            'collection_run_uuid' => $run->uuid,
            'force' => true,
        ]);

        return back()->with('warning', __('netkeep.devices.collection_force_queued'));
    }

    public function approve(
        Device $device,
        Request $request,
        NetworkTargetGuard $targets,
        SshHostKeyScanner $scanner,
        DeviceApprovalService $approval,
        KnownHostsWriter $knownHosts,
        OxidizedClient $oxidized,
        AuditLogger $audit,
        DangerousFeatureService $dangerous,
    ): RedirectResponse {
        if ($device->transport === 'telnet' && ! $dangerous->enabled(DangerousFeature::Telnet)) {
            abort(422, __('netkeep.security.telnet_disabled'));
        }
        $customModel = CustomModel::query()->where('slug', $device->oxidized_model)->first();
        if ($customModel) {
            abort_unless($customModel->status === 'published', 422, __('netkeep.models.publish_before_assignment'));
        }
        if ($customModel?->source === 'raw') {
            abort_unless($request->user()->role->canManageOwnership(), 403);
            abort_unless($dangerous->enabled(DangerousFeature::RawRuby), 422, __('netkeep.models.raw_disabled'));
        }
        if (
            ! $customModel
            && ! in_array($device->oxidized_model, config('oxidized-security.reviewed_drivers', []), true)
        ) {
            abort_unless($request->user()->role->canManageOwnership(), 403);
            abort_unless(
                $dangerous->enabled(DangerousFeature::UnreviewedDrivers),
                422,
                __('netkeep.models.driver_not_reviewed'),
            );
        }
        $device->forceFill(['custom_model_id' => $customModel?->id])->save();

        $target = $device->hostname ?: $device->ip_address;
        $addresses = $targets->resolve($target);
        $hostKey = null;
        $fingerprint = null;
        if ($device->transport === 'ssh') {
            $scan = $scanner->scan($target, $device->port);
            $hostKey = $scan['keys'];
            $fingerprint = $scan['fingerprint'];
        }

        $approved = $approval->approve(
            $device,
            $request->user(),
            $addresses,
            $hostKey,
            $fingerprint,
        );
        $knownHosts->write();
        $reloaded = $oxidized->reload();
        if (! $reloaded) {
            $approval->invalidate($approved, DeviceApprovalStatus::Revoked);
            $knownHosts->write();
            abort(503, __('netkeep.devices.approval_engine_failed'));
        }

        $audit->record('device.approved', $approved, [
            'transport' => $approved->transport,
            'port' => $approved->port,
            'driver' => $approved->oxidized_model,
            'ssh_fingerprint' => $fingerprint,
        ]);

        return back()->with('success', __('netkeep.devices.approved'));
    }

    public function revoke(
        Device $device,
        DeviceApprovalService $approval,
        KnownHostsWriter $knownHosts,
        OxidizedClient $oxidized,
        AuditLogger $audit,
    ): RedirectResponse {
        $approval->invalidate($device, DeviceApprovalStatus::Revoked);
        $knownHosts->write();
        $oxidized->reload();
        $audit->record('device.approval_revoked', $device);

        return back()->with('success', __('netkeep.devices.approval_revoked'));
    }

    public function export(AuditLogger $audit): StreamedResponse
    {
        $audit->record('devices.exported', metadata: ['format' => 'csv']);
        $headers = $this->localizedCsvHeaders();

        return response()->streamDownload(function () use ($headers): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                throw new \RuntimeException(__('netkeep.csv.open_export_failed'));
            }
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, $headers);
            Device::query()->with(['group', 'site'])->orderBy('id')->chunk(500, function ($devices) use ($stream): void {
                foreach ($devices as $device) {
                    fputcsv($stream, [
                        $device->name, $device->hostname, $device->ip_address, $device->port,
                        $device->transport, $device->manufacturer, $device->hardware_model,
                        $device->oxidized_model, $device->group?->name, $device->site?->name,
                        $device->enabled ? '1' : '0',
                    ]);
                }
            });
            fclose($stream);
        }, 'netkeep-devices.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function import(Request $request, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:5120']]);
        $handle = fopen($validated['file']->getRealPath(), 'r');
        if ($handle === false) {
            throw new \RuntimeException(__('netkeep.csv.read_failed'));
        }
        $headers = array_map(
            fn (?string $header): string => $this->canonicalCsvHeader((string) $header),
            fgetcsv($handle) ?: [],
        );
        if (count($headers) !== count(array_unique($headers))) {
            abort(422, __('netkeep.csv.duplicate_columns'));
        }
        $required = ['name', 'ip_address', 'oxidized_model'];
        abort_unless(
            count(array_intersect($required, $headers)) === count($required),
            422,
            __('netkeep.csv.missing_columns'),
        );

        $count = 0;
        $errors = [];
        while (($row = fgetcsv($handle)) !== false) {
            if ($count >= 10000) {
                fclose($handle);
                abort(422, __('netkeep.csv.record_limit'));
            }
            $record = array_combine($headers, array_pad($row, count($headers), null));
            if (! $record || empty($record['name']) || empty($record['ip_address'])) {
                $errors[] = ['row' => $count + 2, 'error' => 'required_fields'];
                $count++;

                continue;
            }

            $rowValidator = Validator::make($record, [
                'name' => ['required', 'string', 'max:255'],
                'hostname' => ['nullable', 'string', 'max:255'],
                'ip_address' => ['required', 'ip'],
                'port' => ['nullable', 'integer', 'between:1,65535'],
                'transport' => ['nullable', Rule::in(['ssh', 'telnet'])],
                'oxidized_model' => ['required', 'alpha_dash:ascii', 'max:120'],
                'enabled' => ['nullable', Rule::in(['0', '1'])],
            ]);
            if ($rowValidator->fails()) {
                $errors[] = ['row' => $count + 2, 'error' => $rowValidator->errors()->keys()[0] ?? 'invalid'];
                $count++;

                continue;
            }

            $group = empty($record['group']) ? null : DeviceGroup::query()->firstOrCreate(['name' => $record['group']]);
            $site = empty($record['site']) ? null : Site::query()->firstOrCreate(['name' => $record['site']]);
            Device::query()->updateOrCreate(
                ['name' => $record['name']],
                [
                    'hostname' => ($record['hostname'] ?? null) ?: null,
                    'ip_address' => $record['ip_address'],
                    'port' => (int) (($record['port'] ?? null) ?: 22),
                    'transport' => ($record['transport'] ?? null) ?: 'ssh',
                    'manufacturer' => ($record['manufacturer'] ?? null) ?: null,
                    'hardware_model' => ($record['hardware_model'] ?? null) ?: null,
                    'oxidized_model' => $record['oxidized_model'],
                    'device_group_id' => $group?->id,
                    'site_id' => $site?->id,
                    'enabled' => false,
                    'approval_status' => DeviceApprovalStatus::Pending,
                    'status' => DeviceStatus::Pending,
                ],
            );
            $count++;
        }
        fclose($handle);
        if ($errors !== []) {
            return back()->withErrors(['file' => __('netkeep.csv.invalid_rows', ['count' => count($errors)])])
                ->with('csv_preview', ['rows' => $count, 'errors' => array_slice($errors, 0, 100)]);
        }
        $audit->record('devices.imported', metadata: ['format' => 'csv', 'count' => $count, 'enabled' => false]);

        return back()->with('success', __('netkeep.devices.imported', ['count' => $count]));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Device $device = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('devices')->ignore($device?->id)->whereNull('deleted_at')],
            'hostname' => ['nullable', 'string', 'max:255'],
            'ip_address' => ['required', 'ip'],
            'port' => ['required', 'integer', 'between:1,65535'],
            'transport' => ['required', Rule::in(['ssh', 'telnet'])],
            'manufacturer' => ['nullable', 'string', 'max:120'],
            'hardware_model' => ['nullable', 'string', 'max:120'],
            'oxidized_model' => ['required', 'alpha_dash:ascii', 'max:120'],
            'site_id' => ['nullable', 'exists:sites,id'],
            'device_group_id' => ['nullable', 'exists:device_groups,id'],
            'credential_profile_id' => ['nullable', 'exists:credential_profiles,id'],
            'username_override' => ['nullable', 'string', 'max:255'],
            'password_override' => ['nullable', 'string', 'max:10000'],
            'enable_secret_override' => ['nullable', 'string', 'max:10000'],
            'backup_interval' => ['required', 'integer', 'between:300,604800'],
            'timeout' => ['required', 'integer', 'between:5,300'],
            'enabled' => ['boolean'],
            'remove_secrets' => ['nullable', 'boolean'],
            'tags' => ['array', 'max:30'],
            'tags.*' => ['nullable', 'string', 'max:64'],
            'tag_list' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($request->has('tag_list')) {
            $data['tags'] = collect(explode(',', (string) ($data['tag_list'] ?? '')))
                ->map(fn (string $tag): string => trim($tag))
                ->filter()
                ->unique()
                ->take(30)
                ->values()
                ->all();
        }
        unset($data['tag_list']);
        $data['custom_model_id'] = CustomModel::query()
            ->where('slug', $data['oxidized_model'])
            ->value('id');

        return $data;
    }

    /**
     * @param  array<int, string>  $tags
     * @return array<int, int>
     */
    private function tagIds(array $tags): array
    {
        return collect($tags)
            ->filter()
            ->map(fn (string $tag): int => Tag::query()->firstOrCreate(['name' => trim($tag)])->id)
            ->unique()
            ->values()
            ->all();
    }

    /** @return list<string> */
    private function localizedCsvHeaders(): array
    {
        return array_map(
            fn (string $header): string => (string) __("netkeep.csv.headers.{$header}"),
            self::CSV_HEADERS,
        );
    }

    private function canonicalCsvHeader(string $header): string
    {
        $normalized = $this->normalizeCsvHeader($header);

        foreach (SupportedLocale::cases() as $locale) {
            foreach (self::CSV_HEADERS as $canonical) {
                $translated = (string) Lang::get("netkeep.csv.headers.{$canonical}", [], $locale->value);
                if ($normalized === $this->normalizeCsvHeader($translated)) {
                    return $canonical;
                }
            }
        }

        return $normalized;
    }

    private function normalizeCsvHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', trim($header)) ?? '';
        $header = mb_strtolower($header, 'UTF-8');

        return preg_replace('/[\s-]+/u', '_', $header) ?? $header;
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        $organization = Organization::query()->first();
        $settings = $organization ? ($organization->settings ?? []) : [];
        /** @var list<string> $nativeModels */
        $nativeModels = config('oxidized-models.models', []);

        return [
            'groups' => DeviceGroup::query()->orderBy('name')->get(['id', 'name']),
            'sites' => Site::query()->orderBy('name')->get(['id', 'name']),
            'credentials' => CredentialProfile::query()->orderBy('name')->get(['id', 'name']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name', 'color']),
            'manufacturers' => Manufacturer::query()->orderBy('name')->get(['id', 'name']),
            'hardwareModels' => HardwareModel::query()
                ->with('manufacturer:id,name')
                ->orderBy('name')
                ->get(['id', 'manufacturer_id', 'name', 'oxidized_model']),
            'defaults' => [
                'backup_interval' => (int) ($settings['default_backup_interval'] ?? 3600),
                'timeout' => (int) ($settings['default_timeout'] ?? 20),
            ],
            'oxidizedModels' => collect($nativeModels)
                ->merge(CustomModel::query()->where('status', 'published')->pluck('slug'))
                ->unique()
                ->sort()
                ->values()
                ->all(),
            'oxidizedVersion' => config('oxidized-models.version'),
            'telnetEnabled' => app(DangerousFeatureService::class)->enabled(DangerousFeature::Telnet),
        ];
    }
}
