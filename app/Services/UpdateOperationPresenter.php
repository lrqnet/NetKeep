<?php

namespace App\Services;

use App\Enums\UpdateOperationStatus;
use App\Models\UpdateOperation;

class UpdateOperationPresenter
{
    /** @return array<string, mixed> */
    public function payload(UpdateOperation $operation): array
    {
        $lastProgressAt = $operation->last_progress_at
            ?? $operation->updated_at
            ?? $operation->requested_at;
        $stalledAfter = $this->stalledAfter($operation->status);
        $stalled = $operation->status->active()
            && $lastProgressAt->lte(now()->subSeconds($stalledAfter));
        $finishedAt = $operation->completed_at ?? now();

        return [
            'uuid' => $operation->uuid,
            'trigger' => $operation->trigger->value,
            'status' => $operation->status->value,
            'from_version' => $operation->from_version,
            'to_version' => $operation->to_version,
            'compatibility' => $operation->compatibility->value,
            'safe_error_code' => $operation->safe_error_code,
            'requested_at' => $operation->requested_at->toIso8601String(),
            'started_at' => $operation->started_at?->toIso8601String(),
            'completed_at' => $operation->completed_at?->toIso8601String(),
            'last_progress_at' => $lastProgressAt->toIso8601String(),
            'acknowledged_at' => $operation->acknowledged_at?->toIso8601String(),
            'elapsed_seconds' => (int) $operation->requested_at->diffInSeconds($finishedAt),
            'stalled' => $stalled,
            'stalled_after_seconds' => $stalledAfter,
        ];
    }

    private function stalledAfter(UpdateOperationStatus $status): int
    {
        return match ($status) {
            UpdateOperationStatus::Queued => 120,
            UpdateOperationStatus::BackingUp => 3600,
            UpdateOperationStatus::Validating => 300,
            UpdateOperationStatus::Downloading => 2100,
            UpdateOperationStatus::Applying => 4500,
            UpdateOperationStatus::Restarting => 900,
            default => 0,
        };
    }
}
