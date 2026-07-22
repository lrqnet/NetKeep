<?php

namespace App\Models;

use App\Enums\ReleaseCompatibility;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $status
 * @property string|null $etag
 * @property string|null $available_version
 * @property ReleaseCompatibility|null $compatibility
 * @property string|null $release_url
 * @property array<string, mixed>|null $assets
 * @property bool $manual_eligible
 * @property bool $automatic_eligible
 * @property bool $rollback_safe
 * @property bool $requires_host_steps
 * @property int $estimated_downtime_seconds
 * @property CarbonImmutable|null $published_at
 * @property CarbonImmutable|null $last_attempt_at
 * @property CarbonImmutable|null $last_success_at
 * @property string|null $last_error_code
 * @property string|null $last_notified_version
 */
class UpdateReleaseState extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'assets' => 'array',
            'compatibility' => ReleaseCompatibility::class,
            'manual_eligible' => 'boolean',
            'automatic_eligible' => 'boolean',
            'rollback_safe' => 'boolean',
            'requires_host_steps' => 'boolean',
            'published_at' => 'immutable_datetime',
            'last_attempt_at' => 'immutable_datetime',
            'last_success_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
