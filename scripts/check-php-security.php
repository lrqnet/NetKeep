<?php

// Urgent runtime fix: CVE-2026-109618 and CVE-2026-109619.
// https://www.php.net/archive/2026.php

namespace NetKeep\Build;

function isPatchedPhp(string $version): bool
{
    if (! preg_match('/^8\.(4|5)\.[0-9]+$/D', $version)) {
        return false;
    }

    return (version_compare($version, '8.4.27', '>=') && version_compare($version, '8.5.0', '<'))
        || (version_compare($version, '8.5.12', '>=') && version_compare($version, '8.6.0', '<'));
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    if (! isPatchedPhp(PHP_VERSION)) {
        fwrite(STDERR, "Unsupported or unpatched PHP runtime. Require PHP 8.4.27+ or 8.5.12+ within those release lines (CVE-2026-109618, CVE-2026-109619).\n");
        exit(1);
    }

    fwrite(STDOUT, 'Patched PHP runtime: '.PHP_VERSION."\n");
}
