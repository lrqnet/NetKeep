<?php

namespace App\Http\Controllers;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Services\CollectionRunSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CollectionRunController extends Controller
{
    public function index(Device $device, Request $request, CollectionRunSerializer $serializer): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(CollectionRunStatus::class)],
            'origin' => ['nullable', Rule::enum(CollectionTrigger::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $runs = $device->collectionRuns()
            ->with(['requester:id,name', 'parent:id,uuid', 'artifacts'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['origin'] ?? null, fn ($query, $origin) => $query->where('trigger', $origin))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        return response()->json([
            'data' => $runs->getCollection()->map(
                fn (CollectionRun $run): array => $serializer->run($run, $request->user()),
            )->values(),
            'meta' => [
                'current_page' => $runs->currentPage(),
                'last_page' => $runs->lastPage(),
                'per_page' => $runs->perPage(),
                'total' => $runs->total(),
            ],
        ])->header('Cache-Control', 'no-store, private');
    }

    public function events(CollectionRun $run, Request $request, CollectionRunSerializer $serializer): JsonResponse
    {
        $data = $request->validate(['after' => ['nullable', 'integer', 'min:0']]);
        $events = $run->events()
            ->when(isset($data['after']), fn ($query) => $query->where('id', '>', (int) $data['after']))
            ->orderBy('id')
            ->limit(200)
            ->get();

        return response()->json([
            'run' => $serializer->run($run->loadMissing(['requester:id,name', 'parent:id,uuid', 'artifacts']), $request->user()),
            'events' => $events->map(fn ($event): array => $serializer->event($event, $request->user()))->values(),
        ])->header('Cache-Control', 'no-store, private');
    }

    public function stream(CollectionRun $run, Request $request, CollectionRunSerializer $serializer): StreamedResponse
    {
        $cursor = max(0, (int) ($request->header('Last-Event-ID') ?: $request->query('after', 0)));
        $user = $request->user();
        $counterKey = "collection-stream:{$user->id}:{$run->id}";
        $lock = Cache::lock($counterKey.':lock', 5);
        $allowed = $lock->get(function () use ($counterKey): bool {
            $count = (int) Cache::get($counterKey, 0);
            if ($count >= 2) {
                return false;
            }
            Cache::put($counterKey, $count + 1, 60);

            return true;
        });
        abort_unless($allowed, 429);

        return response()->stream(function () use ($run, $user, $serializer, $counterKey, $cursor): void {
            $started = microtime(true);
            $heartbeatAt = 0.0;
            $lastStatus = null;
            try {
                while (microtime(true) - $started < (int) config('netkeep.diagnostics.stream_seconds', 30)) {
                    if (connection_aborted()) {
                        break;
                    }
                    $run->refresh();
                    $status = $run->status->value;
                    if ($status !== $lastStatus) {
                        $this->sendSse('collection.status', ['status' => $status]);
                        $lastStatus = $status;
                    }
                    $pending = $run->events()->where('id', '>', $cursor)->orderBy('id')->limit(100)->get();
                    foreach ($pending as $event) {
                        $cursor = $event->id;
                        $this->sendSse('collection.event', $serializer->event($event, $user), (string) $event->id);
                    }
                    if (! $run->status->isPending() && $pending->isEmpty()) {
                        $this->sendSse('end', ['status' => $status]);
                        break;
                    }
                    if (microtime(true) - $heartbeatAt >= (int) config('netkeep.diagnostics.heartbeat_seconds', 10)) {
                        $this->sendSse('heartbeat', ['at' => now()->toIso8601String()]);
                        $heartbeatAt = microtime(true);
                    }
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                    usleep(500000);
                }
            } finally {
                Cache::lock($counterKey.':lock', 5)->get(function () use ($counterKey): void {
                    $remaining = max(0, (int) Cache::get($counterKey, 1) - 1);
                    $remaining === 0 ? Cache::forget($counterKey) : Cache::put($counterKey, $remaining, 60);
                });
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-store, private',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** @param array<string, mixed> $data */
    private function sendSse(string $event, array $data, ?string $id = null): void
    {
        if ($id !== null) {
            echo 'id: '.$id."\n";
        }
        echo 'event: '.$event."\n";
        echo 'data: '.json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)."\n\n";
    }
}
