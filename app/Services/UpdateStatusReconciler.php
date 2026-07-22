<?php

namespace App\Services;

use App\Enums\UpdateOperationStatus;
use App\Models\UpdateOperation;
use Illuminate\Support\Facades\File;

class UpdateStatusReconciler
{
    public function __construct(
        private readonly UpdateExchangeService $exchange,
        private readonly UpdateSnapshotService $snapshots,
    ) {}

    public function reconcile(): int
    {
        $count = 0;
        foreach (File::glob($this->exchange->root().'/status/*.json') as $path) {
            if (is_link($path) || ! is_file($path) || filesize($path) === false || filesize($path) > 65536) {
                File::delete($path);

                continue;
            }
            $payload = json_decode(File::get($path), true);
            if (! is_array($payload) || ! is_string($payload['operation_uuid'] ?? null)) {
                File::delete($path);

                continue;
            }
            $status = UpdateOperationStatus::tryFrom((string) ($payload['status'] ?? ''));
            $operation = UpdateOperation::query()->where('uuid', $payload['operation_uuid'])->first();
            if (! $status || ! $operation || basename($path) !== $operation->uuid.'.json') {
                File::delete($path);

                continue;
            }
            if (! $operation->status->active() || ! $this->transitionAllowed($operation->status, $status)) {
                File::delete($path);

                continue;
            }
            $errorCode = is_string($payload['error_code'] ?? null)
                && preg_match('/^[a-z0-9_]{1,64}$/', $payload['error_code']) === 1
                    ? $payload['error_code']
                    : null;
            $operation->update([
                'status' => $status,
                'safe_error_code' => $errorCode,
                'completed_at' => $status->active() ? null : now(),
            ]);
            File::delete($path);
            $count++;
        }
        if ($count > 0) {
            $this->snapshots->prune();
        }

        return $count;
    }

    private function transitionAllowed(UpdateOperationStatus $current, UpdateOperationStatus $next): bool
    {
        if (in_array($next, [UpdateOperationStatus::Succeeded, UpdateOperationStatus::Failed, UpdateOperationStatus::RecoveryRequired], true)) {
            return true;
        }

        return $this->rank($next) >= $this->rank($current);
    }

    private function rank(UpdateOperationStatus $status): int
    {
        return match ($status) {
            UpdateOperationStatus::Queued => 0,
            UpdateOperationStatus::BackingUp => 1,
            UpdateOperationStatus::Validating => 2,
            UpdateOperationStatus::Downloading => 3,
            UpdateOperationStatus::Applying => 4,
            UpdateOperationStatus::Restarting => 5,
            default => -1,
        };
    }
}
