<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DangerousFeature;
use App\Enums\ReleaseCompatibility;
use App\Enums\UserRole;
use App\Jobs\CheckForUpdates;
use App\Jobs\PrepareUpdateOperation;
use App\Models\AuditEvent;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Models\UpdateOperation;
use App\Models\UpdateReleaseState;
use App\Models\User;
use App\Services\DangerousFeatureService;
use App\Services\UpdateStatusReconciler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
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
        $this->actingAs($administrator)
            ->post('/updates/reauthenticate', ['password' => 'password'])
            ->assertForbidden();
        $this->actingAs($administrator)
            ->post('/updates/run', [])
            ->assertForbidden();
        $this->actingAs($administrator)
            ->post('/updates/operations/'.Str::uuid().'/acknowledge')
            ->assertForbidden();
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
                'request_id' => (string) Str::uuid(),
                'to_version' => 'invalid-version',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('to_version');

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/updates/run', [
                'request_id' => (string) Str::uuid(),
                'to_version' => '1.0.3',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('to_version');

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/updates/run', [
                'request_id' => (string) Str::uuid(),
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
                'request_id' => (string) Str::uuid(),
                'to_version' => '1.0.1',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('update');

        $this->assertDatabaseCount('update_operations', 0);
    }

    public function test_manual_update_requires_the_dedicated_recent_reauthentication(): void
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
            ->post('/updates/run', [
                'request_id' => (string) Str::uuid(),
                'to_version' => '1.0.2',
                'accepted' => '1',
            ])
            ->assertSessionHasErrors('reauthentication');

        $this->assertDatabaseCount('update_operations', 0);
        Queue::assertNotPushed(PrepareUpdateOperation::class);
    }

    public function test_reauthentication_validates_the_password_and_starts_the_exact_request_once(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
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
        $destination = BackupDestination::query()->create([
            'name' => 'Update archive',
            'type' => 'local',
            'enabled' => true,
            'config' => [],
        ]);
        $requestId = (string) Str::uuid();
        $payload = [
            'request_id' => $requestId,
            'to_version' => '1.0.2',
            'accepted' => '1',
        ];

        $this->actingAs($owner)
            ->post('/updates/reauthenticate', ['password' => 'incorrect'])
            ->assertSessionHasErrors('password');

        $this->post('/updates/run', $payload)
            ->assertSessionHasErrors('reauthentication');

        $this->post('/updates/reauthenticate', ['password' => 'password'])
            ->assertRedirect();
        $this->post('/updates/run', $payload)
            ->assertRedirect('/updates')
            ->assertSessionHas('success');
        $this->post('/updates/run', $payload)
            ->assertRedirect('/updates');
        $this->post('/updates/run', [
            ...$payload,
            'destination_id' => $destination->id,
        ])->assertSessionHasErrors('request_id');

        $this->assertDatabaseCount('update_operations', 1);
        $this->assertDatabaseHas('update_operations', [
            'request_id' => $requestId,
            'from_version' => '1.0.1',
            'to_version' => '1.0.2',
            'status' => 'queued',
        ]);
        $this->assertSame(1, AuditEvent::query()->where('action', 'update.queued')->count());
        $this->assertSame(1, AuditEvent::query()->where('action', 'update.reauthenticated')->count());
        Queue::assertPushed(PrepareUpdateOperation::class, 1);
    }

    public function test_operation_status_is_no_store_stall_aware_and_persists_until_acknowledged(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $organization = Organization::query()->firstOrFail();
        $operation = UpdateOperation::query()->create([
            'uuid' => (string) Str::uuid(),
            'request_id' => (string) Str::uuid(),
            'organization_id' => $organization->id,
            'requested_by' => $owner->id,
            'trigger' => 'manual',
            'status' => 'queued',
            'from_version' => '1.0.1',
            'to_version' => '1.0.2',
            'compatibility' => ReleaseCompatibility::SameMajor,
            'requested_at' => now()->subMinutes(4),
            'last_progress_at' => now()->subMinutes(3),
        ]);

        $response = $this->actingAs($owner)
            ->getJson("/updates/operations/{$operation->uuid}")
            ->assertOk()
            ->assertJson([
                'uuid' => $operation->uuid,
                'status' => 'queued',
                'stalled' => true,
                'stalled_after_seconds' => 120,
            ]);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        foreach (range(1, 12) as $attempt) {
            $this->getJson("/updates/operations/{$operation->uuid}")
                ->assertOk();
        }

        $this->get('/updates')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('operation.uuid', $operation->uuid)
                ->where('operation.stalled', true)
                ->where('netkeep.update.operation.uuid', $operation->uuid));

        $this->post("/updates/operations/{$operation->uuid}/acknowledge")
            ->assertSessionHasErrors('operation');

        $operation->update([
            'status' => 'succeeded',
            'completed_at' => now(),
            'last_progress_at' => now(),
        ]);
        $this->post("/updates/operations/{$operation->uuid}/acknowledge")
            ->assertRedirect();
        $this->post("/updates/operations/{$operation->uuid}/acknowledge")
            ->assertRedirect();

        $this->assertNotNull($operation->refresh()->acknowledged_at);
        $this->assertSame(1, AuditEvent::query()->where('action', 'update.status_acknowledged')->count());
        $this->get('/updates')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('operation', null)
                ->where('netkeep.update.operation', null));
    }

    public function test_reconciler_records_each_updater_progress_transition(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $organization = Organization::query()->firstOrFail();
        $operation = UpdateOperation::query()->create([
            'uuid' => (string) Str::uuid(),
            'request_id' => (string) Str::uuid(),
            'organization_id' => $organization->id,
            'requested_by' => $owner->id,
            'trigger' => 'manual',
            'status' => 'validating',
            'from_version' => '1.0.1',
            'to_version' => '1.0.2',
            'compatibility' => ReleaseCompatibility::SameMajor,
            'requested_at' => now()->subMinutes(5),
            'last_progress_at' => now()->subMinutes(4),
        ]);
        $exchangePath = storage_path('framework/testing/update-reconcile-'.Str::uuid());
        config(['netkeep.updates.exchange_path' => $exchangePath]);

        try {
            File::ensureDirectoryExists($exchangePath.'/status');
            File::put(
                $exchangePath.'/status/'.$operation->uuid.'.json',
                json_encode([
                    'operation_uuid' => $operation->uuid,
                    'status' => 'downloading',
                ], JSON_THROW_ON_ERROR),
            );

            $this->assertSame(1, app(UpdateStatusReconciler::class)->reconcile());
            $operation->refresh();
            $this->assertSame('downloading', $operation->status->value);
            $this->assertTrue($operation->last_progress_at->greaterThan(now()->subMinute()));
            $this->assertFileDoesNotExist($exchangePath.'/status/'.$operation->uuid.'.json');
        } finally {
            File::deleteDirectory($exchangePath);
        }
    }

    public function test_upgrade_acknowledges_only_operations_that_were_already_terminal(): void
    {
        $organization = Organization::query()->firstOrFail();
        $migration = require database_path('migrations/2026_07_23_000000_improve_update_operation_feedback.php');
        $migration->down();
        $completedUuid = (string) Str::uuid();
        $activeUuid = (string) Str::uuid();
        $timestamp = now()->subMinute();
        $base = [
            'organization_id' => $organization->id,
            'requested_by' => null,
            'backup_destination_id' => null,
            'snapshot_archive_id' => null,
            'trigger' => 'manual',
            'from_version' => '1.0.2',
            'to_version' => '1.0.3',
            'compatibility' => ReleaseCompatibility::SameMajor->value,
            'safe_error_code' => null,
            'metadata' => null,
            'requested_at' => $timestamp,
            'started_at' => $timestamp,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ];
        DB::table('update_operations')->insert([
            [
                ...$base,
                'uuid' => $completedUuid,
                'status' => 'succeeded',
                'completed_at' => $timestamp,
            ],
            [
                ...$base,
                'uuid' => $activeUuid,
                'status' => 'restarting',
                'completed_at' => null,
            ],
        ]);

        $migration->up();

        $this->assertNotNull(
            DB::table('update_operations')->where('uuid', $completedUuid)->value('acknowledged_at'),
        );
        $this->assertNull(
            DB::table('update_operations')->where('uuid', $activeUuid)->value('acknowledged_at'),
        );
    }
}
