<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Models\CollectionRun;
use Illuminate\Support\Facades\DB;

class CollectionRunService
{
    public function dispatch(CollectionRun $run): void
    {
        app(CollectionRunEventService::class)->record($run, 'target_validation_started');
        $device = $run->device;
        if (
            ! app(DeviceApprovalService::class)->isCurrent($device)
            || ! app(DeviceSafetyPolicy::class)->allows($device)
        ) {
            app(DeviceApprovalService::class)->invalidate($device);
            app(KnownHostsWriter::class)->write();
            $this->cancel($run, 'device_safety_changed');

            return;
        }

        try {
            app(NetworkTargetGuard::class)->assertApprovedResolution(
                $device->hostname ?: $device->ip_address,
                $device->approved_resolved_addresses ?? [],
            );
            app(CollectionRunEventService::class)->record($run, 'target_validation_passed');
            if ($device->transport === 'ssh') {
                $scan = app(SshHostKeyScanner::class)->scan(
                    $device->hostname ?: $device->ip_address,
                    $device->port,
                );
                if (! hash_equals((string) $device->ssh_host_key_fingerprint, (string) $scan['fingerprint'])) {
                    app(DeviceApprovalService::class)->invalidate($device, DeviceApprovalStatus::HostKeyChanged);
                    app(KnownHostsWriter::class)->write();
                    $this->cancel($run, 'ssh_host_key_changed');

                    return;
                }
                app(CollectionRunEventService::class)->record(
                    $run,
                    'ssh_validation_passed',
                    context: ['fingerprint_verified' => true],
                );
            }
        } catch (\Throwable) {
            app(DeviceApprovalService::class)->invalidate($device);
            app(KnownHostsWriter::class)->write();
            $this->cancel($run, 'target_validation_failed');

            return;
        }

        $accepted = DB::transaction(function () use ($run): bool {
            $locked = CollectionRun::query()->with('device')->lockForUpdate()->findOrFail($run->id);

            if (
                $locked->status !== CollectionRunStatus::Dispatched
                || ! $locked->device->enabled
                || $locked->device->approval_status !== DeviceApprovalStatus::Approved
            ) {
                $locked->update([
                    'status' => CollectionRunStatus::Cancelled,
                    'finished_at' => now(),
                    'error_code' => 'device_not_collectable',
                ]);

                return false;
            }

            $locked->update([
                'status' => CollectionRunStatus::Running,
                'started_at' => now(),
                'engine_reference' => $locked->device->uuid,
            ]);

            return true;
        });

        if (! $accepted) {
            app(CollectionRunEventService::class)->record(
                $run->refresh(),
                'cancelled',
                level: 'warning',
                context: ['error_code' => 'device_not_collectable'],
            );

            return;
        }

        app(CollectionRunEventService::class)->record($run->refresh(), 'started');

        if (! app(OxidizedClient::class)->collect($run->device->uuid)) {
            $this->fail($run->refresh(), 'engine_failure');

            return;
        }
        app(CollectionRunEventService::class)->record($run->refresh(), 'engine_accepted');
    }

    public function succeed(CollectionRun $run): void
    {
        $succeeded = DB::transaction(function () use ($run): bool {
            $locked = CollectionRun::query()->with('device')->lockForUpdate()->findOrFail($run->id);
            if ($locked->status !== CollectionRunStatus::Running) {
                return false;
            }

            $locked->update([
                'status' => CollectionRunStatus::Succeeded,
                'finished_at' => now(),
                'error_code' => null,
            ]);
            if ($locked->trigger !== CollectionTrigger::Diagnostic) {
                $locked->device->update([
                    'status' => DeviceStatus::Healthy,
                    'consecutive_failures' => 0,
                    'last_error' => null,
                ]);
            }

            return true;
        });
        if ($succeeded) {
            app(CollectionRunEventService::class)->record($run->refresh(), 'success');
        }
    }

    public function fail(
        CollectionRun $run,
        string $errorCode,
        ?string $technicalMessage = null,
        bool $recordEvent = true,
    ): void {
        $failed = DB::transaction(function () use ($run, $errorCode): bool {
            $locked = CollectionRun::query()->with('device')->lockForUpdate()->findOrFail($run->id);
            if (! in_array($locked->status, [CollectionRunStatus::Running, CollectionRunStatus::Dispatched], true)) {
                return false;
            }

            $locked->update([
                'status' => CollectionRunStatus::Failed,
                'finished_at' => now(),
                'error_code' => $errorCode,
            ]);
            if ($locked->trigger === CollectionTrigger::Diagnostic) {
                return true;
            }

            $locked->device->increment('consecutive_failures');
            $locked->device->update([
                'status' => DeviceStatus::Failing,
                'last_error' => __('netkeep.devices.collection_failed_safe'),
            ]);

            $delays = config('netkeep.collections.retry_delays', [60, 300, 900]);
            $delay = $delays[$locked->attempt - 1] ?? null;
            if ($delay === null) {
                return true;
            }

            app(CollectionRequestService::class)->request(
                $locked->device,
                CollectionTrigger::Retry,
                attempt: $locked->attempt + 1,
                parent: $locked,
                scheduledFor: now()->addSeconds((int) $delay),
            );

            return true;
        });

        if ($failed && $recordEvent) {
            app(CollectionRunEventService::class)->record(
                $run->refresh(),
                'failure',
                level: 'error',
                technicalMessage: $technicalMessage,
                context: ['error_code' => $errorCode],
            );
        }
    }

    public function cancel(CollectionRun $run, string $errorCode): void
    {
        $cancelled = CollectionRun::query()
            ->whereKey($run->id)
            ->whereIn('status', [CollectionRunStatus::Dispatched, CollectionRunStatus::Running])
            ->update([
                'status' => CollectionRunStatus::Cancelled,
                'finished_at' => now(),
                'error_code' => $errorCode,
                'updated_at' => now(),
            ]);
        if ($cancelled > 0) {
            app(CollectionRunEventService::class)->record(
                $run->refresh(),
                'cancelled',
                level: 'warning',
                context: ['error_code' => $errorCode],
            );
        }
    }
}
