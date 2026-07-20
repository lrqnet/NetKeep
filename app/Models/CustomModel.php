<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $status
 * @property string|null $last_test_status
 * @property string|null $last_test_message
 */
class CustomModel extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'definition' => 'array',
            'published_at' => 'immutable_datetime',
            'last_tested_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<Device, $this> */
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }
}
