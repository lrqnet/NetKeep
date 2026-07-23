<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Models\CollectionRun;
use App\Models\CollectionRunArtifact;

class CollectionRetentionService
{
    public function __construct(private CollectionTraceCrypto $crypto) {}

    /** @return array{artifacts:int,runs:int} */
    public function prune(): array
    {
        $artifacts = 0;
        CollectionRunArtifact::query()
            ->whereNull('purged_at')
            ->where('expires_at', '<=', now())
            ->orderBy('expires_at')
            ->chunkById(100, function ($expired) use (&$artifacts): void {
                foreach ($expired as $artifact) {
                    $this->crypto->purge($artifact);
                    $artifacts++;
                }
            }, 'uuid');

        $runs = 0;
        CollectionRun::query()
            ->whereIn('status', [
                CollectionRunStatus::Succeeded,
                CollectionRunStatus::Failed,
                CollectionRunStatus::Cancelled,
            ])
            ->where('finished_at', '<=', now()->subDays((int) config('netkeep.diagnostics.run_retention_days', 30)))
            ->with('artifacts')
            ->orderBy('id')
            ->chunkById(100, function ($expiredRuns) use (&$runs, &$artifacts): void {
                foreach ($expiredRuns as $run) {
                    foreach ($run->artifacts as $artifact) {
                        if ($artifact->purged_at === null) {
                            $this->crypto->purge($artifact);
                            $artifacts++;
                        }
                    }
                    $run->delete();
                    $runs++;
                }
            });

        return compact('artifacts', 'runs');
    }
}
