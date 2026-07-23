<?php

namespace App\Http\Controllers\Internal;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Http\Controllers\Controller;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Services\CollectionRunEventService;
use App\Services\CollectionTraceCrypto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OxidizedTraceController extends Controller
{
    public function __invoke(
        string $deviceUuid,
        Request $request,
        CollectionTraceCrypto $crypto,
        CollectionRunEventService $events,
    ): JsonResponse {
        abort_unless($request->isMethod('put'), 405);
        abort_unless($request->header('Content-Type') === 'application/octet-stream', 415);
        abort_if(
            (int) $request->server('CONTENT_LENGTH', 0) > (int) config('netkeep.diagnostics.trace_max_bytes'),
            413,
        );
        $device = Device::query()->where('uuid', $deviceUuid)->firstOrFail();
        $run = CollectionRun::query()
            ->where('device_id', $device->id)
            ->where('trigger', CollectionTrigger::Diagnostic)
            ->whereIn('status', [
                CollectionRunStatus::Dispatched,
                CollectionRunStatus::Running,
                CollectionRunStatus::Succeeded,
                CollectionRunStatus::Failed,
            ])
            ->where('created_at', '>=', now()->subMinutes(10))
            ->latest('id')
            ->firstOrFail();
        $stream = $request->getContent(true);
        $artifact = $crypto->store(
            $run,
            $stream,
            filter_var($request->header('X-NetKeep-Truncated'), FILTER_VALIDATE_BOOL),
        );
        $events->record($run, 'trace_stored', 'sandbox', context: [
            'size' => $artifact->size,
            'truncated' => $artifact->truncated,
            'expires_at' => $artifact->expires_at->toIso8601String(),
        ]);

        return response()->json([
            'accepted' => true,
            'artifact_uuid' => $artifact->uuid,
            'truncated' => $artifact->truncated,
        ], 201)->header('Cache-Control', 'no-store');
    }
}
