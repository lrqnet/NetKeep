<?php

namespace App\Console\Commands;

use App\Services\CollectionOrchestrator;
use Illuminate\Console\Command;

class DispatchCollectionsCommand extends Command
{
    protected $signature = 'netkeep:dispatch-collections';

    protected $description = 'Agenda e despacha coletas controladas pelo NetKeep';

    public function handle(CollectionOrchestrator $orchestrator): int
    {
        $result = $orchestrator->tick();
        $this->info("Agendadas: {$result['scheduled']}; despachadas: {$result['dispatched']}.");

        return self::SUCCESS;
    }
}
