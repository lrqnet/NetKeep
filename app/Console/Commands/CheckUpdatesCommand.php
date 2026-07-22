<?php

namespace App\Console\Commands;

use App\Services\ReleaseDiscoveryService;
use Illuminate\Console\Command;

class CheckUpdatesCommand extends Command
{
    protected $signature = 'netkeep:check-updates {--force}';

    protected $description = 'Consulta releases oficiais do NetKeep';

    public function handle(ReleaseDiscoveryService $releases): int
    {
        $releases->check((bool) $this->option('force'));

        return self::SUCCESS;
    }
}
