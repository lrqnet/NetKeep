<?php

namespace Tests\Unit;

use App\Services\DnsResolver;
use App\Services\NetworkTargetGuard;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class NetworkTargetGuardTest extends TestCase
{
    protected bool $withCompletedSetup = false;

    public function test_missing_optional_internal_services_do_not_block_a_valid_target(): void
    {
        $resolver = new class extends DnsResolver
        {
            public function resolve(string $host): array
            {
                return $host === 'router.example' ? ['10.10.10.10'] : [];
            }
        };

        $addresses = (new NetworkTargetGuard($resolver))->resolve('router.example');

        $this->assertSame(['10.10.10.10'], $addresses);
    }

    public function test_an_internal_service_address_remains_blocked(): void
    {
        $resolver = new class extends DnsResolver
        {
            public function resolve(string $host): array
            {
                return match ($host) {
                    'router.example', 'app' => ['10.10.10.10'],
                    default => [],
                };
            }
        };

        $this->expectException(ValidationException::class);

        (new NetworkTargetGuard($resolver))->resolve('router.example');
    }

    public function test_an_empty_target_resolution_is_rejected(): void
    {
        $resolver = new class extends DnsResolver
        {
            public function resolve(string $host): array
            {
                return [];
            }
        };

        $this->expectException(ValidationException::class);

        (new NetworkTargetGuard($resolver))->resolve('router.example');
    }

    public function test_dns_errors_are_normalized_to_an_empty_result(): void
    {
        $this->assertSame([], (new DnsResolver)->resolve('netkeep-target-does-not-exist.invalid'));
    }
}
