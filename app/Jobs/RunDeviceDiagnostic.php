<?php

namespace App\Jobs;

use App\Enums\CollectionRunStatus;
use App\Enums\DeviceApprovalStatus;
use App\Models\CollectionRun;
use App\Models\CustomModel;
use App\Services\CollectionErrorClassifier;
use App\Services\CollectionRunEventService;
use App\Services\CollectionRunService;
use App\Services\CustomModelPublisher;
use App\Services\DeviceApprovalService;
use App\Services\DeviceSafetyPolicy;
use App\Services\KnownHostsWriter;
use App\Services\NetworkTargetGuard;
use App\Services\SandboxConfigurationService;
use App\Services\SandboxLock;
use App\Services\SandboxOxidizedClient;
use App\Services\SshHostKeyScanner;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RunDeviceDiagnostic implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 420;

    public function __construct(public int $runId) {}

    public function handle(
        CollectionRunService $runs,
        CollectionRunEventService $events,
        CollectionErrorClassifier $errors,
        SandboxConfigurationService $configuration,
        SandboxOxidizedClient $oxidized,
        CustomModelPublisher $publisher,
    ): void {
        $run = CollectionRun::query()->with(['device.credentials', 'device.group', 'device.customModel'])->find($this->runId);
        if (! $run || $run->status !== CollectionRunStatus::Dispatched) {
            return;
        }

        try {
            Cache::lock(SandboxLock::KEY, 420)->block(5, function () use (
                $run,
                $runs,
                $events,
                $configuration,
                $oxidized,
                $publisher,
            ): void {
                $this->validateTarget($run, $events);
                $started = DB::transaction(function () use ($run): bool {
                    $locked = CollectionRun::query()->lockForUpdate()->findOrFail($run->id);
                    if ($locked->status !== CollectionRunStatus::Dispatched) {
                        return false;
                    }
                    $locked->update([
                        'status' => CollectionRunStatus::Running,
                        'started_at' => now(),
                        'engine_reference' => 'sandbox:'.$locked->device->uuid,
                    ]);

                    return true;
                });
                if (! $started) {
                    return;
                }
                $run->refresh();
                $events->record($run, 'started', 'sandbox');
                $device = $run->device;
                $sandboxPath = (string) config('netkeep.sandbox.config_path');
                app(KnownHostsWriter::class)->write($sandboxPath);
                $previousConfiguration = $configuration->activateDiagnostic();
                $previousModel = null;
                $customModel = $device->custom_model_id === null ? null : $device->customModel;
                try {
                    if ($customModel) {
                        $previousModel = $publisher->publishTo($customModel, $sandboxPath);
                    }
                    Cache::put('netkeep:sandbox-selection', [
                        'mode' => 'diagnostic',
                        'device_id' => $device->id,
                        'model_slug' => $customModel instanceof CustomModel
                            ? $customModel->slug
                            : $device->oxidized_model,
                        'run_id' => $run->id,
                        'started_at' => $run->started_at?->toIso8601String(),
                    ], now()->addMinutes(10));
                    if (! $oxidized->restart() || ! $oxidized->collect($device->uuid)) {
                        throw new RuntimeException('sandbox_rejected');
                    }
                    $events->record($run, 'engine_accepted', 'sandbox');
                    $this->awaitResult($run, $oxidized, $run->started_at ?? now(), $runs);
                } finally {
                    Cache::forget('netkeep:sandbox-selection');
                    if ($customModel) {
                        $publisher->rollbackFrom($customModel, $previousModel, $sandboxPath);
                    }
                    $configuration->restore($previousConfiguration);
                    if (! $oxidized->restart()) {
                        throw new RuntimeException('sandbox_restore_failed');
                    }
                }
            });
        } catch (\Throwable $exception) {
            $message = $exception->getMessage();
            if (in_array($message, ['device_not_collectable', 'target_validation_failed'], true)) {
                $runs->cancel($run->refresh(), $message);

                return;
            }
            $errorCode = $exception instanceof LockTimeoutException
                ? 'sandbox_busy'
                : $errors->classify($exception::class, $message);
            $runs->fail($run->refresh(), $errorCode, $message);
        }
    }

    private function validateTarget(CollectionRun $run, CollectionRunEventService $events): void
    {
        $device = $run->device;
        $events->record($run, 'target_validation_started', 'sandbox');
        if (
            ! $device->enabled
            || $device->approval_status !== DeviceApprovalStatus::Approved
            || ! app(DeviceApprovalService::class)->isCurrent($device)
            || ! app(DeviceSafetyPolicy::class)->allows($device)
        ) {
            throw new RuntimeException('device_not_collectable');
        }

        try {
            app(NetworkTargetGuard::class)->assertApprovedResolution(
                $device->hostname ?: $device->ip_address,
                $device->approved_resolved_addresses ?? [],
            );
            if ($device->transport === 'ssh') {
                $scan = app(SshHostKeyScanner::class)->scan(
                    $device->hostname ?: $device->ip_address,
                    $device->port,
                );
                if (! hash_equals((string) $device->ssh_host_key_fingerprint, (string) $scan['fingerprint'])) {
                    app(DeviceApprovalService::class)->invalidate($device, DeviceApprovalStatus::HostKeyChanged);
                    app(KnownHostsWriter::class)->write();
                    throw new RuntimeException('ssh_host_key_changed');
                }
                $events->record($run, 'ssh_validation_passed', 'sandbox', context: ['fingerprint_verified' => true]);
            }
        } catch (RuntimeException $exception) {
            throw $exception;
        } catch (\Throwable) {
            throw new RuntimeException('target_validation_failed');
        }
        $events->record($run, 'target_validation_passed', 'sandbox');
    }

    private function awaitResult(
        CollectionRun $run,
        SandboxOxidizedClient $oxidized,
        CarbonInterface $startedAt,
        CollectionRunService $runs,
    ): void {
        $deadline = now()->addSeconds(min(300, max(30, $run->device->timeout * 3)));
        while (now()->isBefore($deadline)) {
            $run->refresh();
            if (! $run->status->isPending()) {
                return;
            }
            $node = collect($oxidized->nodes())->first(
                fn (mixed $candidate): bool => is_array($candidate)
                    && ($candidate['name'] ?? null) === $run->device->uuid,
            );
            if (is_array($node)) {
                $status = strtolower((string) (data_get($node, 'last.status') ?? ''));
                if (in_array($status, ['error', 'failed', 'no_connection'], true)) {
                    throw new RuntimeException('sandbox_collection_failed');
                }
                $ended = data_get($node, 'last.end');
                if (in_array($status, ['success', 'done', 'unchanged', 'no_change'], true)
                    && is_string($ended)
                    && Carbon::parse($ended)->greaterThanOrEqualTo($startedAt)) {
                    $runs->succeed($run);

                    return;
                }
            }
            sleep(2);
        }

        throw new RuntimeException('sandbox_collection_timeout');
    }
}
