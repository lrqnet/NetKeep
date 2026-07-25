<?php

namespace App\Http\Controllers\Internal;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Http\Controllers\Controller;
use App\Jobs\ReconcileCollectionRun;
use App\Models\CollectionRun;
use App\Models\CollectionRunEvent;
use App\Models\Device;
use App\Services\CollectionErrorClassifier;
use App\Services\CollectionRunEventService;
use App\Services\CollectionRunService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class OxidizedEventController extends Controller
{
    public function __invoke(
        Request $request,
        CollectionRunEventService $events,
        CollectionErrorClassifier $errors,
        CollectionRunService $runs,
    ): JsonResponse {
        abort_if(
            (int) $request->server('CONTENT_LENGTH', 0) > 8192
            || strlen($request->getContent()) > 8192,
            413,
        );
        $data = $request->validate([
            'event_id' => ['required', 'uuid'],
            'occurred_at' => ['required', 'date'],
            'event' => ['required', Rule::in(['node_success', 'node_fail', 'post_store'])],
            'node_name' => ['required', 'uuid'],
            'node_ip' => ['nullable', 'string', 'max:255'],
            'node_group' => ['nullable', 'string', 'max:255'],
            'node_model' => ['nullable', 'string', 'max:255'],
            'job_status' => ['nullable', 'string', 'max:64'],
            'job_time' => ['nullable', 'string', 'max:64'],
            'error_type' => ['nullable', 'string', 'max:512'],
            'error_reason' => ['nullable', 'string', 'max:4096'],
        ]);
        $existing = CollectionRunEvent::query()
            ->with('run.device')
            ->where('event_id', $data['event_id'])
            ->first();
        if ($existing) {
            abort_unless($existing->run->device->uuid === $data['node_name'], 409);

            return response()->json(['accepted' => true, 'event_id' => $existing->event_id], 202)
                ->header('Cache-Control', 'no-store');
        }
        $occurredAt = Carbon::parse($data['occurred_at']);
        abort_if($occurredAt->isBefore(now()->subMinutes(5)) || $occurredAt->isAfter(now()->addMinute()), 422);
        $device = Device::query()->where('uuid', $data['node_name'])->firstOrFail();
        $runQuery = CollectionRun::query()
            ->where('device_id', $device->id)
            ->where('created_at', '>=', now()->subMinutes(10));
        $run = $data['event'] === 'node_fail'
            ? $runQuery->whereIn('status', [CollectionRunStatus::Dispatched, CollectionRunStatus::Running])
                ->latest('id')
                ->first()
            : $runQuery->whereIn('status', [
                CollectionRunStatus::Dispatched,
                CollectionRunStatus::Running,
                CollectionRunStatus::Succeeded,
            ])->latest('id')->first();
        if (! $run) {
            return response()->json(['accepted' => false, 'event_id' => $data['event_id']], 202)
                ->header('Cache-Control', 'no-store');
        }
        $source = $run->trigger === CollectionTrigger::Diagnostic ? 'sandbox' : 'oxidized';
        $code = match ((string) $data['event']) {
            'node_success' => 'engine_succeeded',
            'node_fail' => 'failure',
            'post_store' => 'configuration_stored',
            default => 'engine_event',
        };
        $errorCode = $data['event'] === 'node_fail'
            ? $errors->classify($data['error_type'] ?? null, $data['error_reason'] ?? null)
            : null;
        $event = $events->record(
            $run,
            $code,
            $source,
            $data['event'] === 'node_fail' ? 'error' : 'info',
            $data['event'] === 'node_fail'
                ? trim(($data['error_type'] ?? '').' '.($data['error_reason'] ?? ''))
                : null,
            array_filter([
                'job_status' => $data['job_status'] ?? null,
                'job_time' => $data['job_time'] ?? null,
                'model' => $data['node_model'] ?? null,
                'group' => $data['node_group'] ?? null,
                'error_code' => $errorCode,
            ], static fn (mixed $value): bool => $value !== null && $value !== ''),
            $data['event_id'],
            $occurredAt,
        );
        if ($errorCode !== null) {
            $runs->fail($run, $errorCode, recordEvent: false);
        } elseif ($data['event'] === 'post_store' && $run->trigger !== CollectionTrigger::Diagnostic) {
            ReconcileCollectionRun::dispatch($run->id);
        }

        return response()->json(['accepted' => true, 'event_id' => $event->event_id], 202)
            ->header('Cache-Control', 'no-store');
    }
}
