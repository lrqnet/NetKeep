<?php

namespace App\Jobs;

use App\Enums\BackupDestinationRunStatus;
use App\Models\BackupDestination;
use App\Services\FullBackupService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class RunFullBackup implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 7200;

    public int $uniqueFor = 7500;

    /** @var list<int> */
    public array $backoff = [300, 900, 1800];

    public function __construct(public int $destinationId) {}

    public function uniqueId(): string
    {
        return (string) $this->destinationId;
    }

    public function handle(FullBackupService $backups): void
    {
        $destination = BackupDestination::query()->findOrFail($this->destinationId);
        $archive = $backups->create($destination);
        SendAlert::dispatch(
            'backup',
            'netkeep.alerts.backup_completed',
            ['archive_id' => $archive->id, 'checksum' => $archive->checksum, 'destination' => $destination->name],
        );
    }

    public function failed(Throwable $exception): void
    {
        BackupDestination::query()
            ->find($this->destinationId)
            ?->markRunStatus(BackupDestinationRunStatus::Failed);
        SendAlert::dispatch(
            'backup',
            'netkeep.alerts.backup_failed',
            ['destination_id' => $this->destinationId, 'status' => 'failed'],
        );
    }
}
