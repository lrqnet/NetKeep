<?php

namespace App\Support;

use Dotenv\Dotenv;

final class RuntimeEnvironment
{
    public static function load(string $path): void
    {
        if (! is_readable($path)) {
            return;
        }

        Dotenv::createImmutable(dirname($path), basename($path))->safeLoad();
    }
}
