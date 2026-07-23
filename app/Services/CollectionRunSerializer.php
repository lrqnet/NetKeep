<?php

namespace App\Services;

use App\Models\CollectionRun;
use App\Models\CollectionRunArtifact;
use App\Models\CollectionRunEvent;
use App\Models\User;

class CollectionRunSerializer
{
    /** @return array<string, mixed> */
    public function run(CollectionRun $run, User $user): array
    {
        $privileged = $user->role->canManageSystem();
        $artifact = $run->relationLoaded('artifacts')
            ? $run->artifacts->firstWhere('type', 'raw_trace')
            : $run->artifacts()->where('type', 'raw_trace')->first();
        $data = [
            'uuid' => $run->uuid,
            'trigger' => $run->trigger->value,
            'status' => $run->status->value,
            'attempt' => $run->attempt,
            'priority' => $run->priority,
            'scheduled_for' => $run->scheduled_for->toIso8601String(),
            'dispatched_at' => $run->dispatched_at?->toIso8601String(),
            'started_at' => $run->started_at?->toIso8601String(),
            'finished_at' => $run->finished_at?->toIso8601String(),
            'duration_seconds' => $run->started_at && $run->finished_at
                ? $run->started_at->diffInSeconds($run->finished_at)
                : null,
            'error_code' => $run->error_code,
            'requested_by' => $run->requester ? [
                'id' => $run->requester->id,
                'name' => $run->requester->name,
            ] : null,
            'parent_uuid' => $run->parent?->uuid,
            'artifact' => $artifact ? $this->artifact($artifact) : null,
        ];
        if ($privileged) {
            $data['engine_reference'] = $run->engine_reference;
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function event(CollectionRunEvent $event, User $user): array
    {
        $data = [
            'id' => $event->id,
            'event_id' => $event->event_id,
            'occurred_at' => $event->occurred_at->toIso8601String(),
            'source' => $event->source,
            'level' => $event->level,
            'code' => $event->code,
        ];
        if ($user->role->canManageSystem()) {
            $data['technical_message'] = $event->technical_message;
            $data['context'] = $event->context;
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function artifact(CollectionRunArtifact $artifact): array
    {
        return [
            'uuid' => $artifact->uuid,
            'type' => $artifact->type,
            'size' => $artifact->size,
            'truncated' => $artifact->truncated,
            'expires_at' => $artifact->expires_at->toIso8601String(),
            'purged_at' => $artifact->purged_at?->toIso8601String(),
            'available' => $artifact->purged_at === null && $artifact->expires_at->isFuture(),
        ];
    }
}
