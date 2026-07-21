<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $type
 * @property string $name
 * @property string $base_url
 * @property string $token
 * @property array<string, mixed>|null $settings
 * @property bool $enabled
 * @property int $sync_interval
 * @property Carbon|null $last_synced_at
 */
class InventorySource extends Model
{
    protected $guarded = [];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
            'settings' => 'array',
            'enabled' => 'boolean',
            'last_synced_at' => 'immutable_datetime',
        ];
    }

    /** @return HasMany<Device, $this> */
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }
}
