<?php

namespace App\Jobs;

use App\Enums\CollectionRunStatus;
use App\Models\CollectionRun;
use App\Services\CollectionRunService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DispatchDeviceCollection implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(public int $runId) {}

    public function handle(CollectionRunService $runs): void
    {
        $run = CollectionRun::query()->with('device')->find($this->runId);

        if (! $run || $run->status !== CollectionRunStatus::Dispatched) {
            return;
        }

        $runs->dispatch($run);
    }
}
