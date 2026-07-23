<?php

namespace App\Models;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $device_id
 * @property CollectionRunStatus $status
 * @property CollectionTrigger $trigger
 * @property int $attempt
 * @property Carbon $scheduled_for
 * @property Carbon|null $dispatched_at
 * @property Carbon|null $started_at
 * @property Carbon|null $finished_at
 * @property Device $device
 */
class CollectionRun extends Model
{
    protected $guarded = [];

    protected static function booted(): void
    {
        static::creating(function (CollectionRun $run): void {
            $run->uuid ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected function casts(): array
    {
        return [
            'status' => CollectionRunStatus::class,
            'trigger' => CollectionTrigger::class,
            'scheduled_for' => 'immutable_datetime',
            'dispatched_at' => 'immutable_datetime',
            'started_at' => 'immutable_datetime',
            'finished_at' => 'immutable_datetime',
            'cooldown_until' => 'immutable_datetime',
            'metadata' => 'array',
        ];
    }

    /** @return BelongsTo<Device, $this> */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<CollectionRun, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<CollectionRunEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(CollectionRunEvent::class);
    }

    /** @return HasMany<CollectionRunArtifact, $this> */
    public function artifacts(): HasMany
    {
        return $this->hasMany(CollectionRunArtifact::class);
    }
}
