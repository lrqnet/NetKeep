<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DangerousFeature;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Services\DangerousFeatureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class RequestSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_http_ip_login_is_blocked_after_canonical_setup(): void
    {
        Organization::query()->firstOrFail()->update([
            'canonical_url' => 'https://netkeep.example',
        ]);

        $this->get('http://127.0.0.1/login')
            ->assertRedirect('/');

        $this->get('http://127.0.0.1/')
            ->assertOk();
    }

    public function test_canonical_ip_redirects_to_https_in_safe_mode(): void
    {
        Organization::query()->firstOrFail()->update([
            'canonical_url' => 'https://127.0.0.1',
        ]);

        $this->get('http://127.0.0.1/login')
            ->assertRedirect('https://127.0.0.1/login')
            ->assertStatus(308);
    }

    public function test_internal_caddy_approval_remains_available_for_canonical_ip(): void
    {
        Organization::query()->firstOrFail()->update([
            'canonical_url' => 'https://127.0.0.1',
        ]);

        $this->get('http://127.0.0.1/internal/caddy/ask?domain=127.0.0.1')
            ->assertOk();
    }

    public function test_dangerous_http_ip_login_uses_a_separate_short_session(): void
    {
        $organization = Organization::query()->firstOrFail();
        $organization->update(['canonical_url' => 'https://netkeep.example']);
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        app(DangerousFeatureService::class)->set(
            DangerousFeature::HttpIpLogin,
            true,
            $owner,
        );

        $this->get('http://127.0.0.1/login')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('auth/login')
                ->where('unsafeHttpIpLogin', true));

        $this->assertSame(5, config('session.lifetime'));
        $this->assertTrue(config('session.expire_on_close'));
        $this->assertSame('netkeep_recovery_session', config('session.cookie'));
    }

    public function test_untrusted_hostname_is_rejected(): void
    {
        Organization::query()->firstOrFail()->update([
            'canonical_url' => 'https://netkeep.example',
        ]);

        $this->get('http://attacker.example/')
            ->assertStatus(400);
    }
}
