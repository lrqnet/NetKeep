<?php

namespace App\Services;

use App\Enums\UpdateOperationStatus;
use App\Enums\UpdateTrigger;
use App\Jobs\PrepareUpdateOperation;
use App\Models\Organization;
use App\Models\UpdateOperation;
use App\Models\UpdateReleaseState;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UpdateOperationService
{
    public function create(
        UpdateTrigger $trigger,
        ?User $user,
        ?int $destinationId = null,
        ?string $expectedVersion = null,
    ): UpdateOperation {
        return Cache::lock('netkeep:update-operation', 30)->block(5, function () use ($trigger, $user, $destinationId, $expectedVersion): UpdateOperation {
            $operation = DB::transaction(function () use ($trigger, $user, $destinationId, $expectedVersion): UpdateOperation {
                $organization = Organization::query()->lockForUpdate()->firstOrFail();
                $active = UpdateOperation::query()
                    ->where('organization_id', $organization->id)
                    ->whereIn('status', collect(UpdateOperationStatus::cases())
                        ->filter(fn (UpdateOperationStatus $status): bool => $status->active())
                        ->map->value)
                    ->exists();
                if ($active) {
                    throw ValidationException::withMessages(['update' => __('netkeep.updates.already_running')]);
                }
                $release = UpdateReleaseState::query()
                    ->where('organization_id', $organization->id)
                    ->firstOrFail();
                $eligible = $trigger === UpdateTrigger::Automatic
                    ? $release->automatic_eligible
                    : $release->manual_eligible;
                if (! $release->available_version || ! $release->compatibility || ! $eligible) {
                    throw ValidationException::withMessages(['update' => __('netkeep.updates.not_installable')]);
                }
                $current = ReleaseVersion::normalize((string) config('netkeep.version')) ?? '0.0.0';
                if (ReleaseVersion::compare($release->available_version, $current) <= 0) {
                    throw ValidationException::withMessages(['update' => __('netkeep.updates.not_installable')]);
                }
                if ($expectedVersion !== null && ! hash_equals($release->available_version, $expectedVersion)) {
                    throw ValidationException::withMessages(['to_version' => __('netkeep.updates.release_changed')]);
                }

                return UpdateOperation::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'organization_id' => $organization->id,
                    'requested_by' => $user?->id,
                    'backup_destination_id' => $destinationId,
                    'trigger' => $trigger,
                    'status' => UpdateOperationStatus::Queued,
                    'from_version' => $current,
                    'to_version' => $release->available_version,
                    'compatibility' => $release->compatibility,
                    'metadata' => [
                        'assets' => $release->assets,
                        'release_url' => $release->release_url,
                        'rollback_safe' => $release->rollback_safe,
                        'estimated_downtime_seconds' => $release->estimated_downtime_seconds,
                    ],
                    'requested_at' => now(),
                ]);
            });

            PrepareUpdateOperation::dispatch($operation->id);

            return $operation;
        });
    }
}
