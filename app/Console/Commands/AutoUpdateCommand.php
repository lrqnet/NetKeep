<?php

namespace App\Console\Commands;

use App\Enums\DangerousFeature;
use App\Jobs\RunFullBackup;
use App\Jobs\TriggerUpdate;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Services\DangerousFeatureService;
use App\Services\UpdateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;

class AutoUpdateCommand extends Command
{
    protected $signature = 'netkeep:auto-update';

    protected $description = 'Agenda backup e atualização automática dentro da versão principal';

    public function handle(UpdateService $updates, DangerousFeatureService $dangerous): int
    {
        if (! $dangerous->enabled(DangerousFeature::AutomaticUpdates)) {
            return self::SUCCESS;
        }
        $organization = Organization::query()->first();
        if (! ($organization?->settings['auto_update'] ?? false)) {
            return self::SUCCESS;
        }

        return Cache::lock('netkeep:auto-update', 7200)->get(function () use ($organization, $updates): int {
            $status = $updates->status();
            if (! $status['online'] || ! $status['available'] || ! $status['container_id']) {
                return self::SUCCESS;
            }

            $destinationId = (int) ($organization->settings['update_backup_destination_id'] ?? 0);
            $destination = BackupDestination::query()
                ->whereKey($destinationId)
                ->where('enabled', true)
                ->whereIn('type', ['s3', 'local'])
                ->first();
            if (! $destination) {
                $this->error('Atualização ignorada: configure um destino de backup ativo.');

                return self::FAILURE;
            }

            Bus::chain([
                new RunFullBackup($destination->id),
                new TriggerUpdate($status['container_id']),
            ])->dispatch();

            return self::SUCCESS;
        });
    }
}
