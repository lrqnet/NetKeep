<?php

namespace App\Services;

use App\Enums\RiskLevel;

class CollectionRiskService
{
    public function interval(int $seconds): RiskLevel
    {
        if ($seconds < 900) {
            return RiskLevel::Critical;
        }

        return $seconds < 3600 ? RiskLevel::Warning : RiskLevel::Normal;
    }

    public function concurrency(int $threads): RiskLevel
    {
        if ($threads > 10) {
            return RiskLevel::Critical;
        }

        return $threads > 5 ? RiskLevel::Warning : RiskLevel::Normal;
    }

    public function timeout(int $seconds): RiskLevel
    {
        if ($seconds > 180) {
            return RiskLevel::Critical;
        }

        return $seconds > 60 ? RiskLevel::Warning : RiskLevel::Normal;
    }
}
