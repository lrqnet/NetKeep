<?php

namespace App\Console\Commands;

use App\Enums\DangerousFeature;
use App\Enums\UpdateTrigger;
use App\Models\Organization;
use App\Models\UpdateReleaseState;
use App\Services\DangerousFeatureService;
use App\Services\UpdateOperationService;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

class AutoUpdateCommand extends Command
{
    protected $signature = 'netkeep:auto-update';

    protected $description = 'Agenda backup e atualização automática dentro da versão principal';

    public function handle(UpdateOperationService $operations, DangerousFeatureService $dangerous): int
    {
        if (! $dangerous->enabled(DangerousFeature::AutomaticUpdates)) {
            return self::SUCCESS;
        }
        $organization = Organization::query()->first();
        if (! ($organization?->settings['auto_update'] ?? false)) {
            return self::SUCCESS;
        }

        $timezone = $organization->timezone ?: 'UTC';
        $now = now($timezone);
        $days = array_map('intval', (array) ($organization->settings['auto_update_days'] ?? [1, 2, 3, 4, 5, 6, 7]));
        $start = (string) ($organization->settings['auto_update_window_start'] ?? '03:00');
        $end = (string) ($organization->settings['auto_update_window_end'] ?? '04:00');
        if (! in_array($now->dayOfWeekIso, $days, true) || $now->format('H:i') < $start || $now->format('H:i') >= $end) {
            return self::SUCCESS;
        }
        $release = UpdateReleaseState::query()->where('organization_id', $organization->id)->first();
        if (! $release?->automatic_eligible) {
            return self::SUCCESS;
        }
        try {
            $operations->create(
                UpdateTrigger::Automatic,
                null,
                filled($organization->settings['update_backup_destination_id'] ?? null)
                    ? (int) $organization->settings['update_backup_destination_id']
                    : null,
            );
        } catch (ValidationException) {
            return self::SUCCESS;
        }

        return self::SUCCESS;
    }
}
