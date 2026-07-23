<?php

namespace App\Models;

use App\Enums\ReleaseCompatibility;
use App\Enums\UpdateOperationStatus;
use App\Enums\UpdateTrigger;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property string|null $request_id
 * @property int|null $requested_by
 * @property int|null $backup_destination_id
 * @property UpdateOperationStatus $status
 * @property UpdateTrigger $trigger
 * @property ReleaseCompatibility $compatibility
 * @property string $from_version
 * @property string $to_version
 * @property string|null $safe_error_code
 * @property array<string, mixed>|null $metadata
 * @property CarbonImmutable $requested_at
 * @property CarbonImmutable|null $started_at
 * @property CarbonImmutable|null $completed_at
 * @property CarbonImmutable|null $last_progress_at
 * @property CarbonImmutable|null $acknowledged_at
 * @property CarbonImmutable|null $updated_at
 */
class UpdateOperation extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => UpdateOperationStatus::class,
            'trigger' => UpdateTrigger::class,
            'compatibility' => ReleaseCompatibility::class,
            'metadata' => 'array',
            'requested_at' => 'immutable_datetime',
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
            'last_progress_at' => 'immutable_datetime',
            'acknowledged_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<BackupArchive, $this> */
    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(BackupArchive::class, 'snapshot_archive_id');
    }
}
