<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Manufacturer extends Model
{
    protected $guarded = [];

    /** @return HasMany<HardwareModel, $this> */
    public function hardwareModels(): HasMany
    {
        return $this->hasMany(HardwareModel::class);
    }
}
