<?php

namespace App\Http\Controllers;

use App\Enums\DangerousFeature;
use App\Jobs\RunFullBackup;
use App\Jobs\TriggerUpdate;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Services\AuditLogger;
use App\Services\DangerousFeatureService;
use App\Services\UpdateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    public function index(UpdateService $updates, DangerousFeatureService $dangerous): Response
    {
        $organization = Organization::query()->firstOrFail();

        return Inertia::render('updates/index', [
            'status' => $dangerous->enabled(DangerousFeature::AutomaticUpdates)
                ? $updates->status()
                : ['online' => false, 'available' => false, 'current' => (string) config('netkeep.version'), 'candidate' => null, 'container_id' => null],
            'settings' => [
                'auto_update' => $dangerous->enabled(DangerousFeature::AutomaticUpdates)
                    && (bool) ($organization->settings['auto_update'] ?? false),
                'destination_id' => $organization->settings['update_backup_destination_id'] ?? null,
            ],
            'destinations' => BackupDestination::query()
                ->where('enabled', true)
                ->whereIn('type', ['s3', 'local'])
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
        ]);
    }

    public function settings(Request $request, AuditLogger $audit, DangerousFeatureService $dangerous): RedirectResponse
    {
        $data = $request->validate([
            'auto_update' => ['boolean'],
            'destination_id' => ['required', 'exists:backup_destinations,id'],
        ]);
        abort_if(
            (bool) ($data['auto_update'] ?? false)
            && ! $dangerous->enabled(DangerousFeature::AutomaticUpdates),
            422,
            __('netkeep.security.automatic_updates_disabled'),
        );
        $organization = Organization::query()->firstOrFail();
        $organization->update([
            'settings' => [
                ...($organization->settings ?? []),
                'auto_update' => (bool) ($data['auto_update'] ?? false),
                'update_backup_destination_id' => (int) $data['destination_id'],
            ],
        ]);
        $audit->record('update.settings_changed', $organization, ['auto_update' => (bool) ($data['auto_update'] ?? false)]);

        return back()->with('success', __('netkeep.updates.policy_saved'));
    }

    public function run(
        Request $request,
        UpdateService $updates,
        AuditLogger $audit,
        DangerousFeatureService $dangerous,
    ): RedirectResponse {
        abort_unless($dangerous->enabled(DangerousFeature::AutomaticUpdates), 422, __('netkeep.security.automatic_updates_disabled'));
        $data = $request->validate(['destination_id' => ['required', 'exists:backup_destinations,id']]);
        $destination = BackupDestination::query()
            ->whereKey($data['destination_id'])
            ->where('enabled', true)
            ->whereIn('type', ['s3', 'local'])
            ->firstOrFail();
        $status = $updates->status();
        if (! $status['online'] || ! $status['available'] || ! $status['container_id']) {
            return back()->with('error', __('netkeep.updates.none_available'));
        }

        Bus::chain([
            new RunFullBackup($destination->id),
            new TriggerUpdate($status['container_id']),
        ])->dispatch();
        $audit->record('update.queued', metadata: [
            'from' => $status['current'],
            'to' => $status['candidate'],
            'backup_destination_id' => $destination->id,
        ]);

        return back()->with('success', __('netkeep.updates.queued'));
    }
}
