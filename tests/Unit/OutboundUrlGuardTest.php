<?php

namespace Tests\Unit;

use App\Services\OutboundUrlGuard;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class OutboundUrlGuardTest extends TestCase
{
    #[DataProvider('forbiddenUrls')]
    public function test_it_rejects_loopback_link_local_and_embedded_credentials(string $url): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new OutboundUrlGuard)->assertAllowed($url);
    }

    public function test_it_allows_private_management_networks(): void
    {
        (new OutboundUrlGuard)->assertAllowed('https://10.10.10.10/api');
        $this->addToAssertionCount(1);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function forbiddenUrls(): array
    {
        return [
            'loopback' => ['http://127.0.0.1/admin'],
            'metadata' => ['http://169.254.169.254/latest/meta-data'],
            'localhost' => ['http://localhost/internal'],
            'credentials' => ['https://user:password@example.com'],
            'metadata hostname' => ['http://metadata.google.internal/computeMetadata/v1'],
            'multicast' => ['http://224.0.0.1/'],
            'unspecified ipv6' => ['http://[::]/'],
            'ipv4 mapped ipv6' => ['http://[::ffff:127.0.0.1]/'],
            'compose service' => ['http://app/internal'],
            'empty dns result' => ['https://netkeep-target-does-not-exist.invalid/'],
        ];
    }
}
