<?php

namespace App\Services;

final class ReleaseVersion
{
    public static function normalize(?string $version): ?string
    {
        if (! is_string($version) || ! preg_match('/^v?(\d+)\.(\d+)\.(\d+)$/', trim($version), $matches)) {
            return null;
        }

        return ((int) $matches[1]).'.'.((int) $matches[2]).'.'.((int) $matches[3]);
    }

    public static function compare(string $left, string $right): int
    {
        return version_compare(self::normalize($left) ?? '0.0.0', self::normalize($right) ?? '0.0.0');
    }

    public static function major(string $version): int
    {
        return (int) explode('.', self::normalize($version) ?? '0.0.0')[0];
    }
}
