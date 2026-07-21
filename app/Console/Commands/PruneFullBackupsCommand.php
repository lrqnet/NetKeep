<?php

namespace App\Console\Commands;

use App\Services\BackupRetentionService;
use Illuminate\Console\Command;

class PruneFullBackupsCommand extends Command
{
    protected $signature = 'netkeep:prune-backups';

    protected $description = 'Remove backups completos vencidos conforme a retenção configurada';

    public function handle(BackupRetentionService $retention): int
    {
        $this->info("Backups completos removidos: {$retention->prune()}.");

        return self::SUCCESS;
    }
}
