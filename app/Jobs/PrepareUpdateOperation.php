<?php

namespace App\Jobs;

use App\Enums\UpdateOperationStatus;
use App\Models\BackupDestination;
use App\Models\UpdateOperation;
use App\Services\FullBackupService;
use App\Services\UpdateExchangeService;
use App\Services\UpdateSnapshotService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class PrepareUpdateOperation implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 10800;

    public function __construct(public int $operationId) {}

    public function handle(
        UpdateSnapshotService $snapshots,
        FullBackupService $backups,
        UpdateExchangeService $exchange,
    ): void {
        $operation = UpdateOperation::query()->findOrFail($this->operationId);
        $operation->update([
            'status' => UpdateOperationStatus::BackingUp,
            'started_at' => now(),
        ]);
        $snapshots->create($operation);
        if ($operation->backup_destination_id) {
            $destination = BackupDestination::query()
                ->whereKey($operation->backup_destination_id)
                ->where('enabled', true)
                ->whereIn('type', ['local', 's3'])
                ->where('is_system', false)
                ->firstOrFail();
            $backups->create($destination);
        }
        $operation->update(['status' => UpdateOperationStatus::Validating]);
        $exchange->prepare($operation->refresh());
    }

    public function failed(Throwable $exception): void
    {
        UpdateOperation::query()->whereKey($this->operationId)->update([
            'status' => UpdateOperationStatus::Failed->value,
            'safe_error_code' => 'update_prepare_failed',
            'completed_at' => now(),
        ]);
    }
}
