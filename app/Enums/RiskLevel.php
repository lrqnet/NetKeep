<?php

namespace App\Enums;

enum RiskLevel: string
{
    case Normal = 'normal';
    case Warning = 'warning';
    case Critical = 'critical';
}
