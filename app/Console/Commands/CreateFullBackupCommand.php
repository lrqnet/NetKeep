<?php

namespace App\Console\Commands;

use App\Jobs\SendAlert;
use App\Models\BackupDestination;
use App\Services\FullBackupService;
use Illuminate\Console\Command;

class CreateFullBackupCommand extends Command
{
    protected $signature = 'netkeep:backup {destination?}';

    protected $description = 'Cria e envia um backup completo criptografado';

    public function handle(FullBackupService $backups): int
    {
        $destinations = BackupDestination::query()
            ->where('enabled', true)
            ->whereIn('type', ['s3', 'local'])
            ->when($this->argument('destination'), fn ($query, $id) => $query->whereKey($id))
            ->get();
        if ($destinations->isEmpty()) {
            $this->error('Nenhum destino de backup local/S3 habilitado foi encontrado.');

            return self::FAILURE;
        }

        $failed = false;
        foreach ($destinations as $destination) {
            try {
                $archive = $backups->create($destination);
                SendAlert::dispatch('backup', 'netkeep.alerts.backup_completed', [
                    'archive_id' => $archive->id,
                    'destination' => $destination->name,
                ]);
                $this->info("Backup {$archive->path} concluído.");
            } catch (\Throwable $exception) {
                SendAlert::dispatch('backup', 'netkeep.alerts.backup_failed', [
                    'destination_id' => $destination->id,
                    'status' => 'failed',
                ]);
                report($exception);
                $this->error("Backup para {$destination->name} falhou.");
                $failed = true;
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
