<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $uuid
 * @property int $collection_run_id
 * @property string $type
 * @property string|null $encrypted_path
 * @property string $encryption_version
 * @property int $size
 * @property string|null $checksum
 * @property bool $truncated
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $purged_at
 */
class CollectionRunArtifact extends Model
{
    use HasUuids;

    protected $primaryKey = 'uuid';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['encrypted_path'];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'truncated' => 'boolean',
            'expires_at' => 'immutable_datetime',
            'purged_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<CollectionRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(CollectionRun::class, 'collection_run_id');
    }
}
