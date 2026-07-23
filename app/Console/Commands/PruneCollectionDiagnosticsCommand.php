<?php

namespace App\Console\Commands;

use App\Services\CollectionRetentionService;
use Illuminate\Console\Command;

class PruneCollectionDiagnosticsCommand extends Command
{
    protected $signature = 'netkeep:prune-collection-diagnostics';

    protected $description = 'Prune expired collection traces, runs, and events';

    public function handle(CollectionRetentionService $retention): int
    {
        $result = $retention->prune();
        $this->info("Purged {$result['artifacts']} artifacts and {$result['runs']} collection runs.");

        return self::SUCCESS;
    }
}
