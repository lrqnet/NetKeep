<?php

namespace App\Console\Commands;

use App\Services\BackupReconciler;
use App\Services\GitHistory;
use App\Services\OxidizedClient;
use Illuminate\Console\Command;

class ReconcileBackupsCommand extends Command
{
    protected $signature = 'netkeep:reconcile-backups';

    protected $description = 'Reconcilia commits e estado do Oxidized no painel';

    public function handle(BackupReconciler $reconciler, GitHistory $history, OxidizedClient $oxidized): int
    {
        $result = $reconciler->reconcile($history, $oxidized);
        $this->info("Commits: {$result['created']}; falhas: {$result['failed']}; recuperações: {$result['recovered']}.");

        return self::SUCCESS;
    }
}
