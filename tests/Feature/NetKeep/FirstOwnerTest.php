<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FirstOwnerTest extends TestCase
{
    use RefreshDatabase;

    protected bool $withCompletedSetup = false;

    public function test_first_registration_creates_the_only_owner(): void
    {
        $response = $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => 'Network Owner',
            'email' => 'owner@example.com',
            'password' => 'Strong-password-123!',
            'password_confirmation' => 'Strong-password-123!',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();
        $this->assertDatabaseCount('users', 1);
        $this->assertSame(UserRole::Owner, User::query()->first()->role);
        $this->assertNotNull(User::query()->first()->email_verified_at);
        $this->get('/dashboard')->assertRedirect('/setup');
    }

    public function test_public_registration_closes_after_first_owner(): void
    {
        User::factory()->create(['role' => UserRole::Owner]);

        $this->get('/register')->assertNotFound();
        $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => 'Second Owner',
            'email' => 'second@example.com',
            'password' => 'Strong-password-123!',
            'password_confirmation' => 'Strong-password-123!',
        ])->assertSessionHasErrors('email');
        $this->assertDatabaseCount('users', 1);
    }
}
