<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $event_id
 * @property int $collection_run_id
 * @property CarbonImmutable $occurred_at
 * @property string $source
 * @property string $level
 * @property string $code
 * @property string|null $technical_message
 * @property array<string, mixed>|null $context
 */
class CollectionRunEvent extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'immutable_datetime',
            'context' => 'array',
        ];
    }

    /** @return BelongsTo<CollectionRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(CollectionRun::class, 'collection_run_id');
    }
}
