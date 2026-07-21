<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    protected bool $withCompletedSetup = false;

    public function test_english_is_the_default_for_a_clean_installation(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'en')
                ->has('availableLocales', 3));
    }

    public function test_explicit_cookie_precedes_the_organization_default(): void
    {
        Organization::query()->create([
            'name' => 'NetKeep',
            'slug' => 'netkeep',
            'locale' => 'es',
            'timezone' => 'UTC',
        ]);

        $this->withUnencryptedCookie('netkeep_locale', 'pt_BR')
            ->get('/')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'pt_BR'));
    }

    public function test_authenticated_user_precedes_cookie_and_organization(): void
    {
        Organization::query()->create([
            'name' => 'NetKeep',
            'slug' => 'netkeep',
            'locale' => 'es',
            'timezone' => 'UTC',
            'setup_completed_at' => now(),
        ]);
        $user = User::factory()->create([
            'role' => UserRole::Owner,
            'locale' => 'en',
        ]);

        $this->actingAs($user)
            ->withUnencryptedCookie('netkeep_locale', 'pt_BR')
            ->get('/dashboard')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'en'));
    }

    public function test_locale_endpoint_persists_cookie_and_user_preference(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        $this->actingAs($user)
            ->put('/locale', ['locale' => 'es'])
            ->assertRedirect()
            ->assertPlainCookie('netkeep_locale', 'es');

        $this->assertSame('es', $user->refresh()->locale);
        $this->assertDatabaseHas('audit_events', [
            'action' => 'user.locale_updated',
            'user_id' => $user->id,
        ]);
    }

    public function test_locale_endpoint_rejects_an_unsupported_locale(): void
    {
        $this->put('/locale', ['locale' => 'fr'])
            ->assertSessionHasErrors('locale')
            ->assertCookieMissing('netkeep_locale');
    }

    public function test_first_owner_and_setup_keep_the_explicit_locale(): void
    {
        $this->withUnencryptedCookie('netkeep_locale', 'es')->post(route('register.store'), [
            'name' => 'Network Owner',
            'email' => 'owner@example.com',
            'password' => 'Strong-password-123!',
            'password_confirmation' => 'Strong-password-123!',
            'installation_token' => 'netkeep-test-claim-token',
        ])->assertRedirect('/dashboard');

        $owner = User::query()->firstOrFail();
        $this->assertSame('es', $owner->locale);

        $this->actingAs($owner)->post('/setup', [
            'name' => 'ISP Libre',
            'locale' => 'es',
            'timezone' => 'America/Bogota',
            'default_backup_interval' => 3600,
            'default_timeout' => 20,
            'full_backup_retention_days' => 0,
        ])->assertRedirect('https://localhost/dashboard');

        $this->assertSame('es', $owner->refresh()->locale);
        $this->assertSame('es', Organization::query()->firstOrFail()->locale);
    }
}
