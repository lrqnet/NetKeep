<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $type
 * @property string $name
 * @property bool $enabled
 * @property array<string, mixed> $config
 * @property array<int, string>|null $events
 */
class NotificationChannel extends Model
{
    protected $guarded = [];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'config' => 'encrypted:array',
            'events' => 'array',
            'enabled' => 'boolean',
            'last_tested_at' => 'immutable_datetime',
        ];
    }
}
