<?php

namespace App\Jobs;

use App\Enums\CollectionRunStatus;
use App\Models\CollectionRun;
use App\Services\BackupReconciler;
use App\Services\GitHistory;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReconcileCollectionRun implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 30;

    public int $uniqueFor = 120;

    public function __construct(public int $runId) {}

    public function uniqueId(): string
    {
        return (string) $this->runId;
    }

    public function handle(BackupReconciler $reconciler, GitHistory $history): void
    {
        $run = CollectionRun::query()->with('device')->find($this->runId);
        if (! $run || $run->status !== CollectionRunStatus::Running) {
            return;
        }
        $storedAt = $run->events()
            ->where('code', 'configuration_stored')
            ->latest('occurred_at')
            ->first()
            ?->occurred_at;
        if (! $storedAt) {
            return;
        }

        $reconciler->reconcileRun($run, $history, $storedAt, false);
    }
}
