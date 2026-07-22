<?php

namespace Tests\Unit\Services;

use App\Services\CaddyTlsConfigService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class CaddyTlsConfigServiceTest extends TestCase
{
    public function test_ip_canonical_urls_use_static_caddy_authorization_and_internal_issuer(): void
    {
        $site = $this->render('siteContent', 'https://192.0.2.10');
        $global = $this->render('globalContent', 'https://192.0.2.10');

        $this->assertStringContainsString('@canonical query domain=192.0.2.10', $site);
        $this->assertStringContainsString('cert_issuer internal', $global);
        $this->assertStringContainsString('ask http://127.0.0.1:8081', $global);
        $this->assertStringNotContainsString('cert_issuer acme', $global);
    }

    public function test_ipv6_canonical_urls_are_normalized_for_caddy(): void
    {
        $site = $this->render('siteContent', 'https://[2001:db8::10]');
        $global = $this->render('globalContent', 'https://[2001:db8::10]');

        $this->assertStringContainsString('@canonical query domain=2001:db8::10', $site);
        $this->assertStringContainsString('default_sni 2001:db8::10', $global);
        $this->assertStringContainsString('cert_issuer internal', $global);
        $this->assertStringNotContainsString('cert_issuer acme', $global);
    }

    public function test_domain_and_unconfigured_urls_keep_guarded_on_demand_tls(): void
    {
        $domainGlobal = $this->render('globalContent', 'https://netkeep.example');
        $unconfiguredGlobal = $this->render('globalContent', null);

        $this->assertSame('', $this->render('siteContent', 'https://netkeep.example'));
        $this->assertSame('', $this->render('siteContent', null));
        $this->assertStringContainsString('cert_issuer acme', $domainGlobal);
        $this->assertStringContainsString('cert_issuer internal', $domainGlobal);
        $this->assertStringContainsString('ask http://127.0.0.1:8080/internal/caddy/ask', $domainGlobal);
        $this->assertSame($domainGlobal, $unconfiguredGlobal);
    }

    private function render(string $methodName, ?string $canonicalUrl): string
    {
        $method = new ReflectionMethod(CaddyTlsConfigService::class, $methodName);

        return $method->invoke(new CaddyTlsConfigService, $canonicalUrl);
    }
}
