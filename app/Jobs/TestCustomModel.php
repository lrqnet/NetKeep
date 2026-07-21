<?php

namespace App\Jobs;

use App\Enums\DangerousFeature;
use App\Enums\DeviceApprovalStatus;
use App\Models\CustomModel;
use App\Models\Device;
use App\Services\CustomModelPublisher;
use App\Services\DangerousFeatureService;
use App\Services\KnownHostsWriter;
use App\Services\SandboxOxidizedClient;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class TestCustomModel implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 420;

    public function __construct(
        public int $modelId,
        public int $deviceId,
    ) {}

    public function handle(CustomModelPublisher $publisher, SandboxOxidizedClient $oxidized): void
    {
        Cache::lock('netkeep:model-sandbox', 420)->block(5, function () use ($publisher, $oxidized): void {
            $model = CustomModel::query()->findOrFail($this->modelId);
            $device = Device::query()->findOrFail($this->deviceId);
            if (
                ! $device->enabled
                || $device->approval_status !== DeviceApprovalStatus::Approved
                || $device->oxidized_model !== $model->slug
                || (
                    $model->source === 'raw'
                    && ! app(DangerousFeatureService::class)->enabled(DangerousFeature::RawRuby)
                )
                || (
                    $device->transport === 'telnet'
                    && ! app(DangerousFeatureService::class)->enabled(DangerousFeature::Telnet)
                )
            ) {
                throw new \RuntimeException('sandbox_device_not_collectable');
            }
            if ($error = $publisher->validate($model)) {
                $model->update([
                    'last_test_status' => 'failed',
                    'last_test_message' => $error,
                    'last_tested_at' => now(),
                ]);

                return;
            }

            $startedAt = now();
            $sandboxPath = (string) config('netkeep.sandbox.config_path');
            app(KnownHostsWriter::class)->write($sandboxPath);
            $previous = $publisher->publishTo($model, $sandboxPath);
            Cache::put('netkeep:sandbox-selection', [
                'device_id' => $device->id,
                'model_slug' => $model->slug,
                'started_at' => $startedAt->toIso8601String(),
            ], now()->addMinutes(10));
            try {
                if (! $oxidized->reload() || ! $oxidized->collect($device->uuid)) {
                    throw new \RuntimeException('sandbox_rejected');
                }
                $this->awaitResult($device, $oxidized, $startedAt);
                $model->update([
                    'last_test_status' => 'passed',
                    'last_test_message' => 'sandbox_collection_passed',
                    'last_tested_at' => now(),
                ]);
            } catch (\Throwable) {
                $model->update([
                    'last_test_status' => 'failed',
                    'last_test_message' => 'sandbox_collection_failed',
                    'last_tested_at' => now(),
                ]);
            } finally {
                Cache::forget('netkeep:sandbox-selection');
                $publisher->rollbackFrom($model, $previous, $sandboxPath);
                $oxidized->reload();
            }
        });
    }

    private function awaitResult(Device $device, SandboxOxidizedClient $oxidized, CarbonInterface $startedAt): void
    {
        $deadline = now()->addSeconds(min(300, max(30, $device->timeout * 3)));

        while (now()->isBefore($deadline)) {
            $node = collect($oxidized->nodes())->first(
                fn (mixed $candidate): bool => is_array($candidate)
                    && ($candidate['name'] ?? null) === $device->uuid,
            );
            if (is_array($node)) {
                $status = strtolower((string) (data_get($node, 'last.status') ?? ''));
                if (in_array($status, ['error', 'failed', 'no_connection'], true)) {
                    throw new \RuntimeException('sandbox_collection_failed');
                }
                $ended = data_get($node, 'last.end');
                if (in_array($status, ['success', 'done'], true)
                    && is_string($ended)
                    && Carbon::parse($ended)->greaterThanOrEqualTo($startedAt)) {
                    return;
                }
            }
            sleep(5);
        }

        throw new \RuntimeException('sandbox_collection_timeout');
    }
}
