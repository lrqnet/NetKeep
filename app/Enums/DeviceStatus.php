<?php

namespace App\Enums;

enum DeviceStatus: string
{
    case Pending = 'pending';
    case Healthy = 'healthy';
    case Failing = 'failing';
    case Conflict = 'conflict';
    case Disabled = 'disabled';
}
