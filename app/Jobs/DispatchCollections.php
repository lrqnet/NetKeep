<?php

namespace App\Jobs;

use App\Services\CollectionOrchestrator;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DispatchCollections implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 30;

    public int $uniqueFor = 30;

    public function handle(CollectionOrchestrator $orchestrator): void
    {
        $orchestrator->tick();
    }
}
