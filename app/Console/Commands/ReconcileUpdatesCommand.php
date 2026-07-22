<?php

namespace App\Console\Commands;

use App\Services\UpdateStatusReconciler;
use Illuminate\Console\Command;

class ReconcileUpdatesCommand extends Command
{
    protected $signature = 'netkeep:reconcile-updates';

    protected $description = 'Reconcilia o estado do agente de atualização';

    public function handle(UpdateStatusReconciler $reconciler): int
    {
        $reconciler->reconcile();

        return self::SUCCESS;
    }
}
