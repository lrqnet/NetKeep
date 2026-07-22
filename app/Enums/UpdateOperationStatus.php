<?php

namespace App\Enums;

enum UpdateOperationStatus: string
{
    case Queued = 'queued';
    case BackingUp = 'backing_up';
    case Validating = 'validating';
    case Downloading = 'downloading';
    case Applying = 'applying';
    case Restarting = 'restarting';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case RecoveryRequired = 'recovery_required';

    public function active(): bool
    {
        return ! in_array($this, [self::Succeeded, self::Failed, self::RecoveryRequired], true);
    }
}
