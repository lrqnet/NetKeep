<?php

namespace App\Models;

use App\Enums\BackupDestinationRunStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $type
 * @property string $name
 * @property bool $enabled
 * @property array<string, mixed> $config
 * @property BackupDestinationRunStatus|null $last_run_status
 * @property CarbonImmutable|null $last_run_at
 * @property BackupArchive|null $latestArchive
 */
class BackupDestination extends Model
{
    protected $guarded = [];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'config' => 'encrypted:array',
            'enabled' => 'boolean',
            'last_run_status' => BackupDestinationRunStatus::class,
            'last_run_at' => 'immutable_datetime',
        ];
    }

    /** @return HasOne<BackupArchive, $this> */
    public function latestArchive(): HasOne
    {
        return $this->hasOne(BackupArchive::class)->latestOfMany();
    }

    public function markRunStatus(BackupDestinationRunStatus $status): void
    {
        $this->update([
            'last_run_status' => $status,
            'last_run_at' => now(),
        ]);
    }
}
