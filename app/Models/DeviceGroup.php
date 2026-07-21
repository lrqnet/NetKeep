<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property bool $remove_secrets
 */
class DeviceGroup extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['remove_secrets' => 'boolean'];
    }

    /** @return HasMany<Device, $this> */
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }
}
