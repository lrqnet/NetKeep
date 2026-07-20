<?php

namespace App\Enums;

enum CollectionRunStatus: string
{
    case Queued = 'queued';
    case Dispatched = 'dispatched';
    case Running = 'running';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Cooldown = 'cooldown';
    case Cancelled = 'cancelled';

    public function isPending(): bool
    {
        return in_array($this, [self::Queued, self::Dispatched, self::Running, self::Cooldown], true);
    }
}
