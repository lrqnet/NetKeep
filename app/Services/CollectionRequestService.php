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
        bool $rejectActive = false,
    ): CollectionRun {
        $run = DB::transaction(function () use ($device, $trigger, $requester, $force, $attempt, $parent, $scheduledFor, $rejectActive): CollectionRun {
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
                if ($rejectActive) {
                    throw ValidationException::withMessages([
                        'diagnostic' => __('netkeep.devices.collection_active'),
                    ]);
                }

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
                'priority' => match ($trigger) {
                    CollectionTrigger::Diagnostic => 200,
                    CollectionTrigger::Manual => 100,
                    default => 0,
                },
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

        if ($run->wasRecentlyCreated) {
            app(CollectionRunEventService::class)->record(
                $run,
                'queued',
                context: array_filter([
                    'trigger' => $trigger->value,
                    'attempt' => $attempt,
                    'parent_uuid' => $parent?->uuid,
                    'scheduled_for' => $run->scheduled_for->toIso8601String(),
                ], static fn (mixed $value): bool => $value !== null),
            );
            if ($parent) {
                app(CollectionRunEventService::class)->record(
                    $parent,
                    'retry_scheduled',
                    level: 'warning',
                    context: [
                        'retry_uuid' => $run->uuid,
                        'attempt' => $attempt,
                        'scheduled_for' => $run->scheduled_for->toIso8601String(),
                    ],
                );
            }
        }

        return $run;
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
