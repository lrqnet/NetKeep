<?php

namespace App\Enums;

enum DeviceApprovalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Revoked = 'revoked';
    case HostKeyChanged = 'host_key_changed';
}
