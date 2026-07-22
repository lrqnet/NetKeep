<?php

namespace App\Enums;

enum UpdateTrigger: string
{
    case Manual = 'manual';
    case Automatic = 'automatic';
}
