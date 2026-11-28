<?php

// Minimum versions for the November 2026 PHP security release.
// https://www.php.net/archive/2026.php

namespace NetKeep\Build;

function isPatchedPhp(string $version): bool
{
    if (! preg_match('/^8\.(4|5)\.[0-9]+$/D', $version)) {
        return false;
    }

    return (version_compare($version, '8.4.28', '>=') && version_compare($version, '8.5.0', '<'))
        || (version_compare($version, '8.5.13', '>=') && version_compare($version, '8.6.0', '<'));
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    if (! isPatchedPhp(PHP_VERSION)) {
        fwrite(STDERR, "Unsupported or unpatched PHP runtime. Require PHP 8.4.28+ or 8.5.13+ within those release lines.\n");
        exit(1);
    }

    fwrite(STDOUT, 'Patched PHP runtime: '.PHP_VERSION."\n");
}
