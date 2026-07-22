<?php

namespace App\Enums;

enum ReleaseCompatibility: string
{
    case SameMajor = 'same_major';
    case MajorUpgrade = 'major_upgrade';
    case Unsupported = 'unsupported';
}
