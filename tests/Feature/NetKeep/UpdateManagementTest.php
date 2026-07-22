<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DangerousFeature;
use App\Enums\ReleaseCompatibility;
use App\Enums\UserRole;
use App\Jobs\CheckForUpdates;
use App\Jobs\PrepareUpdateOperation;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Models\UpdateReleaseState;
use App\Models\User;
use App\Services\DangerousFeatureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class UpdateManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        config(['netkeep.version' => '1.0.1']);
    }

    public function test_only_the_owner_can_access_update_routes(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $administrator = User::factory()->create(['role' => UserRole::Administrator]);

        $this->actingAs($owner)->get('/updates')->assertOk();
        $this->actingAs($administrator)->get('/updates')->assertForbidden();
    }

    public function test_the_page_exposes_release_state_without_secret_destination_config(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->create([
            'organization_id' => $organization->id,
            'status' => 'available',
            'available_version' => '1.0.2',
            'compatibility' => ReleaseCompatibility::SameMajor,
            'manual_eligible' => true,
            'automatic_eligible' => true,
        ]);
        BackupDestination::query()->create([
            'name' => 'External archive',
            'type' => 's3',
            'enabled' => true,
            'config' => ['secret' => 'example-secret'],
        ]);
        BackupDestination::query()->create([
            'name' => 'Internal recovery',
            'type' => 'local',
            'enabled' => true,
            'is_system' => true,
            'config' => ['password' => 'example-password'],
        ]);

        $this->actingAs($owner)
            ->get('/updates')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('updates/index')
                ->where('release.candidate', '1.0.2')
                ->has('destinations', 1)
                ->missing('destinations.0.config'));
    }

    public function test_check_now_is_queued_and_rate_limited_route_is_owner_only(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)->post('/updates/check')->assertRedirect();

        Queue::assertPushed(CheckForUpdates::class, fn (CheckForUpdates $job): bool => $job->force);
        $this->assertSame('checking', UpdateReleaseState::query()->value('status'));
    }

    public function test_manual_update_creates_one_operation_and_rejects_a_stale_version(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->create([
            'organization_id' => $organization->id,
            'status' => 'available',
            'available_version' => '1.0.2',
            'compatibility' => ReleaseCompatibility::SameMajor,
            'assets' => [],
            'manual_eligible' => true,
            'automatic_eligible' => true,
        ]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/updates/run', [
                'to_version' => '1.0.3',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('to_version');

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/updates/run', [
                'to_version' => '1.0.2',
                'accepted' => '1',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('update_operations', [
            'from_version' => '1.0.1',
            'to_version' => '1.0.2',
            'trigger' => 'manual',
            'status' => 'queued',
        ]);
        Queue::assertPushed(PrepareUpdateOperation::class, 1);
    }

    public function test_automatic_policy_requires_explicit_dangerous_feature_acceptance(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $payload = [
            'auto_update' => '1',
            'days' => [1, 2, 3, 4, 5, 6, 7],
            'window_start' => '03:00',
            'window_end' => '04:00',
        ];

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->put('/updates/settings', $payload)
            ->assertSessionHasErrors('auto_update');

        app(DangerousFeatureService::class)->set(DangerousFeature::AutomaticUpdates, true, $owner);
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->put('/updates/settings', $payload)
            ->assertRedirect();

        $this->assertTrue((bool) Organization::query()->firstOrFail()->settings['auto_update']);
    }

    public function test_an_already_installed_candidate_cannot_create_an_operation(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $organization = Organization::query()->firstOrFail();
        UpdateReleaseState::query()->create([
            'organization_id' => $organization->id,
            'status' => 'available',
            'available_version' => '1.0.1',
            'compatibility' => ReleaseCompatibility::SameMajor,
            'assets' => [],
            'manual_eligible' => true,
            'automatic_eligible' => true,
        ]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/updates/run', [
                'to_version' => '1.0.1',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('update');

        $this->assertDatabaseCount('update_operations', 0);
    }
}
