<?php

namespace App\Http\Controllers;

use App\Models\CollectionRun;
use App\Services\AuditLogger;
use App\Services\CollectionTraceCrypto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CollectionTraceController extends Controller
{
    public function show(
        CollectionRun $run,
        Request $request,
        CollectionTraceCrypto $crypto,
        AuditLogger $audit,
    ): HttpResponse {
        $artifact = $run->artifacts()->where('type', 'raw_trace')->firstOrFail();
        $trace = $crypto->decrypt($artifact);
        $audit->record('collection.trace_viewed', $run, [
            'collection_run_uuid' => $run->uuid,
            'artifact_uuid' => $artifact->uuid,
        ]);

        $response = Inertia::render('collection-runs/trace', [
            'run' => [
                'uuid' => $run->uuid,
                'device_id' => $run->device_id,
                'device_name' => $run->device->name,
                'expires_at' => $artifact->expires_at->toIso8601String(),
                'truncated' => $artifact->truncated,
            ],
            'trace' => $trace,
        ])->toResponse($request);
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    public function download(
        CollectionRun $run,
        CollectionTraceCrypto $crypto,
        AuditLogger $audit,
    ): HttpResponse {
        $artifact = $run->artifacts()->where('type', 'raw_trace')->firstOrFail();
        $trace = $crypto->decrypt($artifact);
        $audit->record('collection.trace_downloaded', $run, [
            'collection_run_uuid' => $run->uuid,
            'artifact_uuid' => $artifact->uuid,
        ]);

        return response($trace, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="netkeep-diagnostic-'.$run->uuid.'.txt"',
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
