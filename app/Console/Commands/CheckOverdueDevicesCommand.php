<?php

namespace App\Console\Commands;

use App\Jobs\SendAlert;
use App\Models\Device;
use Illuminate\Console\Command;

class CheckOverdueDevicesCommand extends Command
{
    protected $signature = 'netkeep:check-overdue';

    protected $description = 'Emite uma vez o alerta para cada equipamento com coleta atrasada';

    public function handle(): int
    {
        $count = 0;

        Device::query()
            ->where('enabled', true)
            ->whereNull('overdue_alerted_at')
            ->chunkById(250, function ($devices) use (&$count): void {
                foreach ($devices as $device) {
                    $dueAt = $device->last_backup_at?->addSeconds($device->backup_interval);
                    if ($dueAt && $dueAt->isFuture()) {
                        continue;
                    }

                    $device->update(['overdue_alerted_at' => now()]);
                    SendAlert::dispatch('overdue', 'netkeep.alerts.overdue', [
                        'device_id' => $device->id,
                        'device' => $device->name,
                        'last_backup_at' => $device->last_backup_at?->toIso8601String(),
                        'interval_seconds' => $device->backup_interval,
                    ]);
                    $count++;
                }
            });

        $this->info("Alertas de atraso emitidos: {$count}.");

        return self::SUCCESS;
    }
}
