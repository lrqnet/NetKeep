<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $locale
 * @property string $timezone
 * @property string|null $domain
 * @property string|null $logo_path
 * @property array<string, mixed>|null $settings
 */
class Organization extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'setup_completed_at' => 'immutable_datetime',
        ];
    }
}
