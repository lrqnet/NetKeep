<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

use function NetKeep\Build\isPatchedPhp;

require_once dirname(__DIR__, 2).'/scripts/check-php-security.php';

class PhpSecurityVersionTest extends TestCase
{
    public function test_rejects_vulnerable_and_unsupported_release_lines(): void
    {
        foreach (['8.3.36', '8.4.0', '8.4.24', '8.4.26', '8.4.27RC1', '8.5.0RC1', '8.5.0', '8.5.11', '8.6.0', 'invalid'] as $version) {
            $this->assertFalse(isPatchedPhp($version), $version);
        }
    }

    public function test_accepts_security_releases_and_later_patches(): void
    {
        foreach (['8.4.27', '8.4.28', '8.5.12', '8.5.13'] as $version) {
            $this->assertTrue(isPatchedPhp($version), $version);
        }
    }
}
