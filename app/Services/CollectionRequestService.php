<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Enums\DeviceApprovalStatus;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CollectionRequestService
{
    public function request(
        Device $device,
        CollectionTrigger $trigger,
        ?User $requester = null,
        bool $force = false,
        int $attempt = 1,
        ?CollectionRun $parent = null,
        ?\DateTimeInterface $scheduledFor = null,
    ): CollectionRun {
        return DB::transaction(function () use ($device, $trigger, $requester, $force, $attempt, $parent, $scheduledFor): CollectionRun {
            $locked = Device::query()->lockForUpdate()->findOrFail($device->id);
            $this->ensureCollectable($locked);

            $pending = $locked->collectionRuns()
                ->whereIn('status', [
                    CollectionRunStatus::Queued,
                    CollectionRunStatus::Dispatched,
                    CollectionRunStatus::Running,
                    CollectionRunStatus::Cooldown,
                ])
                ->latest('id')
                ->first();

            if ($pending) {
                return $pending;
            }

            if (
                $trigger === CollectionTrigger::Manual
                && ! $force
                && $locked->manual_cooldown_until?->isFuture()
            ) {
                throw ValidationException::withMessages([
                    'collection' => __('netkeep.devices.collection_cooldown', [
                        'time' => $locked->manual_cooldown_until->toIso8601String(),
                    ]),
                ]);
            }

            $status = $scheduledFor && $scheduledFor > now()
                ? CollectionRunStatus::Cooldown
                : CollectionRunStatus::Queued;
            $run = $locked->collectionRuns()->create([
                'requested_by' => $requester?->id,
                'parent_id' => $parent?->id,
                'trigger' => $trigger,
                'status' => $status,
                'attempt' => $attempt,
                'priority' => $trigger === CollectionTrigger::Manual ? 100 : 0,
                'scheduled_for' => $scheduledFor ?? now(),
                'cooldown_until' => $status === CollectionRunStatus::Cooldown ? $scheduledFor : null,
            ]);

            if ($trigger === CollectionTrigger::Manual) {
                $locked->forceFill([
                    'manual_cooldown_until' => now()->addSeconds(
                        (int) config('netkeep.collections.manual_cooldown', 300),
                    ),
                ])->save();
            }

            return $run;
        });
    }

    private function ensureCollectable(Device $device): void
    {
        if (! $device->enabled || $device->approval_status !== DeviceApprovalStatus::Approved) {
            throw ValidationException::withMessages([
                'collection' => __('netkeep.devices.collection_requires_approval'),
            ]);
        }

        if (
            ! app(DeviceApprovalService::class)->isCurrent($device)
            || ! app(DeviceSafetyPolicy::class)->allows($device)
        ) {
            app(DeviceApprovalService::class)->invalidate($device);
            app(KnownHostsWriter::class)->write();

            throw ValidationException::withMessages([
                'collection' => __('netkeep.devices.collection_approval_invalidated'),
            ]);
        }

        try {
            app(NetworkTargetGuard::class)->assertApprovedResolution(
                $device->hostname ?: $device->ip_address,
                $device->approved_resolved_addresses ?? [],
            );
        } catch (ValidationException $exception) {
            app(DeviceApprovalService::class)->invalidate($device);

            throw $exception;
        }
    }
}
