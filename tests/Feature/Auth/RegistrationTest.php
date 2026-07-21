<?php

namespace Tests\Feature\Auth;

use App\Support\UserInputLimits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_rejects_fields_above_their_limits(): void
    {
        $response = $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => str_repeat('N', UserInputLimits::NAME + 1),
            'email' => str_repeat('e', UserInputLimits::EMAIL).'@example.com',
            'password' => str_repeat('P', UserInputLimits::PASSWORD + 1),
            'password_confirmation' => str_repeat('P', UserInputLimits::PASSWORD + 1),
        ]);

        $response->assertSessionHasErrors(['name', 'email', 'password']);
        $this->assertGuest();
    }

    public function test_registration_rejects_email_whitespace(): void
    {
        $response = $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => 'Test User',
            'email' => 'test user@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_registration_normalizes_email_case(): void
    {
        $this->post(route('register.store'), [
            'installation_token' => 'netkeep-test-claim-token',
            'name' => 'Test User',
            'email' => 'OWNER@EXAMPLE.COM',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.com',
        ]);
    }
}
