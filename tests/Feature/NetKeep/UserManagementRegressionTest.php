<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_profile_without_transferring_ownership(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $this->actingAs($owner)->withSession(['auth.password_confirmed_at' => time()])
            ->put("/users/{$owner->id}", [
                'name' => 'Updated Owner', 'email' => $owner->email,
                'role' => 'owner', 'locale' => 'en', 'is_active' => true,
            ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Updated Owner', $owner->refresh()->name);
        $this->assertSame(UserRole::Owner, $owner->role);
    }

    public function test_owner_cannot_promote_another_user_through_profile_update(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);
        $this->actingAs($owner)->withSession(['auth.password_confirmed_at' => time()])
            ->put("/users/{$viewer->id}", [
                'name' => $viewer->name, 'email' => $viewer->email,
                'role' => 'owner', 'locale' => 'en', 'is_active' => true,
            ])->assertUnprocessable();
        $this->assertSame(UserRole::Viewer, $viewer->refresh()->role);
    }
}
