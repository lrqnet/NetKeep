<?php

namespace App\Services;

use App\Models\CollectionRun;
use App\Models\CollectionRunEvent;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CollectionRunEventService
{
    public function __construct(private CollectionTechnicalSanitizer $sanitizer) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public function record(
        CollectionRun $run,
        string $code,
        string $source = 'application',
        string $level = 'info',
        ?string $technicalMessage = null,
        array $context = [],
        ?string $eventId = null,
        ?CarbonInterface $occurredAt = null,
    ): CollectionRunEvent {
        $eventId ??= (string) Str::uuid();
        $existing = CollectionRunEvent::query()->where('event_id', $eventId)->first();
        if ($existing) {
            if ($existing->collection_run_id !== $run->id) {
                throw ValidationException::withMessages(['event_id' => 'event_id_replayed']);
            }

            return $existing;
        }

        try {
            return $run->events()->create([
                'event_id' => $eventId,
                'occurred_at' => $occurredAt ?? now(),
                'source' => mb_strcut($source, 0, 32),
                'level' => mb_strcut($level, 0, 16),
                'code' => mb_strcut($code, 0, 64),
                'technical_message' => $this->sanitizer->message($technicalMessage),
                'context' => $this->sanitizer->context($context) ?: null,
            ]);
        } catch (QueryException $exception) {
            $existing = CollectionRunEvent::query()->where('event_id', $eventId)->first();
            if (! $existing) {
                throw $exception;
            }
            if ($existing->collection_run_id !== $run->id) {
                throw ValidationException::withMessages(['event_id' => 'event_id_replayed']);
            }

            return $existing;
        }
    }
}
