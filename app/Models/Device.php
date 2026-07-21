<?php

namespace App\Models;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string|null $hostname
 * @property string $ip_address
 * @property int $port
 * @property string $transport
 * @property string|null $manufacturer
 * @property string|null $hardware_model
 * @property string $oxidized_model
 * @property int $backup_interval
 * @property int $timeout
 * @property bool $enabled
 * @property bool|null $remove_secrets
 * @property DeviceStatus $status
 * @property DeviceApprovalStatus $approval_status
 * @property string|null $approval_fingerprint
 * @property list<string>|null $approved_resolved_addresses
 * @property string|null $ssh_host_key
 * @property string|null $ssh_host_key_fingerprint
 * @property Carbon|null $next_collection_at
 * @property Carbon|null $manual_cooldown_until
 * @property int $consecutive_failures
 * @property int|null $site_id
 * @property string|null $username_override
 * @property string|null $password_override
 * @property string|null $enable_secret_override
 * @property Carbon|null $last_backup_at
 * @property Carbon|null $last_success_at
 * @property Carbon|null $overdue_alerted_at
 * @property string|null $conflict_reason
 * @property Site|null $site
 * @property DeviceGroup|null $group
 * @property CredentialProfile|null $credentials
 * @property CustomModel|null $customModel
 */
class Device extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = ['password_override', 'enable_secret_override'];

    protected static function booted(): void
    {
        static::creating(function (Device $device): void {
            $device->uuid ??= (string) Str::uuid();
        });
    }

    protected function casts(): array
    {
        return [
            'status' => DeviceStatus::class,
            'approval_status' => DeviceApprovalStatus::class,
            'variables' => 'array',
            'enabled' => 'boolean',
            'remove_secrets' => 'boolean',
            'password_override' => 'encrypted',
            'enable_secret_override' => 'encrypted',
            'last_backup_at' => 'immutable_datetime',
            'last_success_at' => 'immutable_datetime',
            'overdue_alerted_at' => 'immutable_datetime',
            'external_missing_since' => 'immutable_datetime',
            'approved_resolved_addresses' => 'array',
            'approved_at' => 'immutable_datetime',
            'next_collection_at' => 'immutable_datetime',
            'manual_cooldown_until' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Site, $this> */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /** @return BelongsTo<DeviceGroup, $this> */
    public function group(): BelongsTo
    {
        return $this->belongsTo(DeviceGroup::class, 'device_group_id');
    }

    /** @return BelongsTo<CredentialProfile, $this> */
    public function credentials(): BelongsTo
    {
        return $this->belongsTo(CredentialProfile::class, 'credential_profile_id');
    }

    /** @return BelongsTo<CustomModel, $this> */
    public function customModel(): BelongsTo
    {
        return $this->belongsTo(CustomModel::class);
    }

    /** @return BelongsTo<InventorySource, $this> */
    public function inventorySource(): BelongsTo
    {
        return $this->belongsTo(InventorySource::class);
    }

    /** @return BelongsToMany<Tag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /** @return HasMany<BackupRun, $this> */
    public function backupRuns(): HasMany
    {
        return $this->hasMany(BackupRun::class);
    }

    /** @return HasMany<CollectionRun, $this> */
    public function collectionRuns(): HasMany
    {
        return $this->hasMany(CollectionRun::class);
    }
}
