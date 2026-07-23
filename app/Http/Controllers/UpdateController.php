<?php

namespace App\Http\Controllers;

use App\Enums\DangerousFeature;
use App\Enums\ReleaseCompatibility;
use App\Enums\UpdateTrigger;
use App\Jobs\CheckForUpdates;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Models\UpdateOperation;
use App\Models\UpdateReleaseState;
use App\Services\AuditLogger;
use App\Services\DangerousFeatureService;
use App\Services\ReleaseVersion;
use App\Services\UpdateOperationPresenter;
use App\Services\UpdateOperationService;
use App\Services\UpdaterHeartbeatService;
use App\Support\UserInputLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    public function index(
        DangerousFeatureService $dangerous,
        UpdaterHeartbeatService $updater,
        UpdateOperationPresenter $presenter,
    ): Response {
        $organization = Organization::query()->firstOrFail();
        $release = UpdateReleaseState::query()->firstOrCreate(['organization_id' => $organization->id]);
        $operation = UpdateOperation::query()
            ->where('organization_id', $organization->id)
            ->whereNull('acknowledged_at')
            ->latest('requested_at')
            ->first();

        return Inertia::render('updates/index', [
            'release' => $this->releasePayload($release),
            'operation' => $operation ? $presenter->payload($operation) : null,
            'updater' => $updater->status(),
            'settings' => [
                'auto_update' => $dangerous->enabled(DangerousFeature::AutomaticUpdates)
                    && (bool) ($organization->settings['auto_update'] ?? false),
                'automatic_updates_accepted' => $dangerous->enabled(DangerousFeature::AutomaticUpdates),
                'destination_id' => $organization->settings['update_backup_destination_id'] ?? null,
                'days' => array_values((array) ($organization->settings['auto_update_days'] ?? [1, 2, 3, 4, 5, 6, 7])),
                'window_start' => (string) ($organization->settings['auto_update_window_start'] ?? '03:00'),
                'window_end' => (string) ($organization->settings['auto_update_window_end'] ?? '04:00'),
                'timezone' => $organization->timezone ?: 'UTC',
            ],
            'destinations' => BackupDestination::query()
                ->where('enabled', true)
                ->where('is_system', false)
                ->whereIn('type', ['s3', 'local'])
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
        ]);
    }

    public function check(Request $request, AuditLogger $audit): RedirectResponse
    {
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->firstOrCreate(['organization_id' => $organization->id])->update([
            'status' => 'checking',
            'last_attempt_at' => now(),
            'last_error_code' => null,
        ]);
        CheckForUpdates::dispatch(true);
        $audit->record('update.check_requested', request: $request);

        return back()->with('success', __('netkeep.updates.check_queued'));
    }

    public function settings(Request $request, AuditLogger $audit, DangerousFeatureService $dangerous): RedirectResponse
    {
        $data = $request->validate([
            'auto_update' => ['required', 'boolean'],
            'destination_id' => [
                'nullable',
                Rule::exists('backup_destinations', 'id')->where(fn ($query) => $query
                    ->where('enabled', true)
                    ->where('is_system', false)
                    ->whereIn('type', ['s3', 'local'])),
            ],
            'days' => ['required', 'array', 'min:1', 'max:7'],
            'days.*' => ['required', 'integer', 'between:1,7', 'distinct'],
            'window_start' => ['required', 'date_format:H:i'],
            'window_end' => ['required', 'date_format:H:i', 'after:window_start'],
        ]);
        if ((bool) $data['auto_update'] && ! $dangerous->enabled(DangerousFeature::AutomaticUpdates)) {
            throw ValidationException::withMessages([
                'auto_update' => __('netkeep.security.automatic_updates_disabled'),
            ]);
        }
        $organization = Organization::query()->firstOrFail();
        $settings = $organization->settings ?? [];
        $settings['auto_update'] = (bool) $data['auto_update'];
        $settings['update_backup_destination_id'] = filled($data['destination_id'] ?? null)
            ? (int) $data['destination_id']
            : null;
        $settings['auto_update_days'] = array_values(array_map('intval', $data['days']));
        $settings['auto_update_window_start'] = $data['window_start'];
        $settings['auto_update_window_end'] = $data['window_end'];
        $organization->update(['settings' => $settings]);
        $audit->record('update.settings_changed', $organization, [
            'auto_update' => (bool) $data['auto_update'],
            'destination_id' => $settings['update_backup_destination_id'],
            'days' => $settings['auto_update_days'],
            'window_start' => $settings['auto_update_window_start'],
            'window_end' => $settings['auto_update_window_end'],
        ], $request);

        return back()->with('success', __('netkeep.updates.policy_saved'));
    }

    public function run(Request $request, UpdateOperationService $operations, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'request_id' => ['required', 'uuid'],
            'to_version' => ['required', 'string', 'max:32'],
            'destination_id' => [
                'nullable',
                Rule::exists('backup_destinations', 'id')->where(fn ($query) => $query
                    ->where('enabled', true)
                    ->where('is_system', false)
                    ->whereIn('type', ['s3', 'local'])),
            ],
            'accepted' => ['required', 'accepted'],
            'confirmation' => ['nullable', 'string', 'max:64'],
        ]);
        if ((int) $request->session()->get('auth.password_confirmed_at', 0) < now()->subMinutes(5)->timestamp) {
            throw ValidationException::withMessages([
                'reauthentication' => __('netkeep.updates.reauthentication_required'),
            ]);
        }
        $expectedVersion = ReleaseVersion::normalize($data['to_version']);
        if ($expectedVersion === null) {
            throw ValidationException::withMessages([
                'to_version' => __('netkeep.updates.release_changed'),
            ]);
        }
        $organization = Organization::query()->firstOrFail();
        $release = UpdateReleaseState::query()->where('organization_id', $organization->id)->firstOrFail();
        if ($release->compatibility === ReleaseCompatibility::MajorUpgrade
            && ! hash_equals((string) $release->available_version, (string) ($data['confirmation'] ?? ''))) {
            throw ValidationException::withMessages(['confirmation' => __('netkeep.updates.confirm_version')]);
        }
        $operation = $operations->create(
            UpdateTrigger::Manual,
            $request->user(),
            filled($data['destination_id'] ?? null) ? (int) $data['destination_id'] : null,
            $expectedVersion,
            $data['request_id'],
        );
        if ($operation->wasRecentlyCreated) {
            $audit->record('update.queued', $operation, [
                'from' => $operation->from_version,
                'to' => $operation->to_version,
                'backup_destination_id' => $operation->backup_destination_id,
            ], $request);
        }

        return to_route('updates.index')->with('success', __('netkeep.updates.queued'));
    }

    public function reauthenticate(Request $request, AuditLogger $audit): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'max:'.UserInputLimits::PASSWORD, 'current_password:web'],
        ]);
        $request->session()->put('auth.password_confirmed_at', time());
        $audit->record('update.reauthenticated', request: $request);

        return back();
    }

    public function operation(string $operation, UpdateOperationPresenter $presenter): JsonResponse
    {
        $organization = Organization::query()->firstOrFail();
        $record = UpdateOperation::query()
            ->where('organization_id', $organization->id)
            ->where('uuid', $operation)
            ->firstOrFail();

        return response()
            ->json($presenter->payload($record))
            ->header('Cache-Control', 'no-store, private')
            ->header('Pragma', 'no-cache');
    }

    public function acknowledge(string $operation, Request $request, AuditLogger $audit): RedirectResponse
    {
        $organization = Organization::query()->firstOrFail();
        $record = UpdateOperation::query()
            ->where('organization_id', $organization->id)
            ->where('uuid', $operation)
            ->firstOrFail();
        if ($record->status->active()) {
            throw ValidationException::withMessages([
                'operation' => __('netkeep.updates.operation_active'),
            ]);
        }
        if ($record->acknowledged_at !== null) {
            return back();
        }
        $record->update(['acknowledged_at' => now()]);
        $audit->record('update.status_acknowledged', $record, [
            'status' => $record->status->value,
        ], $request);

        return back();
    }

    /** @return array<string, mixed> */
    private function releasePayload(UpdateReleaseState $release): array
    {
        $current = ReleaseVersion::normalize((string) config('netkeep.version')) ?? (string) config('netkeep.version');
        $available = filled($release->available_version)
            && ReleaseVersion::compare((string) $release->available_version, $current) > 0;

        return [
            'status' => $available || $release->status !== 'available' ? $release->status : 'up_to_date',
            'current' => $current,
            'candidate' => $available ? $release->available_version : null,
            'compatibility' => $available ? $release->compatibility?->value : null,
            'release_url' => $available ? $release->release_url : null,
            'published_at' => $available ? $release->published_at?->toIso8601String() : null,
            'manual_eligible' => $available && $release->manual_eligible,
            'automatic_eligible' => $available && $release->automatic_eligible,
            'rollback_safe' => $available && $release->rollback_safe,
            'requires_host_steps' => $available && $release->requires_host_steps,
            'estimated_downtime_seconds' => $release->estimated_downtime_seconds,
            'last_attempt_at' => $release->last_attempt_at?->toIso8601String(),
            'last_success_at' => $release->last_success_at?->toIso8601String(),
            'last_error_code' => $release->last_error_code,
        ];
    }
}
