<?php

namespace Tests\Feature\NetKeep;

use App\Enums\BackupDestinationRunStatus;
use App\Enums\UserRole;
use App\Jobs\RunFullBackup;
use App\Models\BackupDestination;
use App\Models\User;
use App\Services\GitMirrorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class DataProtectionManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_s3_and_private_git_destinations_on_the_new_route(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/data-protection/destinations', [
                'type' => 's3',
                'name' => 'S3 vault',
                'enabled' => true,
                'config' => [
                    'bucket' => 'netkeep-example',
                    'key' => 'example-access-key',
                    'secret' => 'example-secret-key',
                    'encryption_mode' => 'password',
                    'password' => 'example-recovery-password',
                    'unexpected' => 'discarded',
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/data-protection/destinations', [
                'type' => 'git',
                'name' => 'Private Git',
                'enabled' => true,
                'config' => [
                    'url' => 'https://git.example.com/netkeep-backup.git',
                    'auth_type' => 'token',
                    'token' => 'example-git-token',
                    'confirm_private' => true,
                    'bucket' => 'discarded',
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(2, BackupDestination::query()->count());
        $this->assertEquals([
            'bucket' => 'netkeep-example',
            'key' => 'example-access-key',
            'secret' => 'example-secret-key',
            'encryption_mode' => 'password',
            'password' => 'example-recovery-password',
        ], BackupDestination::query()->where('type', 's3')->firstOrFail()->config);
        $this->assertEquals([
            'url' => 'https://git.example.com/netkeep-backup.git',
            'auth_type' => 'token',
            'token' => 'example-git-token',
        ], BackupDestination::query()->where('type', 'git')->firstOrFail()->config);
    }

    public function test_owner_can_queue_backup_and_run_git_mirror_on_the_new_routes(): void
    {
        Queue::fake();
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $local = BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local vault',
            'enabled' => true,
            'config' => [
                'encryption_mode' => 'password',
                'password' => 'example-recovery-password',
            ],
        ]);
        $git = BackupDestination::query()->create([
            'type' => 'git',
            'name' => 'Private Git',
            'enabled' => true,
            'config' => [
                'url' => 'https://git.example.com/netkeep-backup.git',
                'auth_type' => 'token',
                'token' => 'example-git-token',
            ],
        ]);
        $mirror = $this->mock(GitMirrorService::class);
        $mirror->shouldReceive('mirror')->once()->withArgs(
            fn (BackupDestination $destination): bool => $destination->is($git),
        );

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post("/data-protection/destinations/{$local->id}/backup")
            ->assertRedirect();

        Queue::assertPushed(
            RunFullBackup::class,
            fn (RunFullBackup $job): bool => $job->destinationId === $local->id,
        );
        $this->assertSame(
            BackupDestinationRunStatus::Queued,
            $local->refresh()->last_run_status,
        );

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post("/data-protection/destinations/{$git->id}/mirror")
            ->assertRedirect();

        $this->assertDatabaseHas('audit_events', [
            'action' => 'backup.queued',
            'subject_id' => $local->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'action' => 'backup.git_mirrored',
            'subject_id' => $git->id,
        ]);
    }

    public function test_owner_can_pause_and_activate_a_destination_without_losing_its_configuration(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $destination = BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local vault',
            'enabled' => true,
            'config' => [
                'encryption_mode' => 'password',
                'password' => 'example-recovery-password',
            ],
        ]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->patch("/data-protection/destinations/{$destination->id}", ['enabled' => false])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertFalse($destination->refresh()->enabled);
        $this->assertSame(
            'example-recovery-password',
            $destination->config['password'],
        );
        $this->assertDatabaseHas('audit_events', [
            'action' => 'backup.destination_status_updated',
            'subject_id' => $destination->id,
        ]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->patch("/data-protection/destinations/{$destination->id}", ['enabled' => true])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue($destination->refresh()->enabled);
    }

    public function test_operator_cannot_change_a_destination_status(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $destination = BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local vault',
            'enabled' => true,
            'config' => [
                'encryption_mode' => 'password',
                'password' => 'example-recovery-password',
            ],
        ]);

        $this->actingAs($operator)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->patch("/data-protection/destinations/{$destination->id}", ['enabled' => false])
            ->assertForbidden();

        $this->assertTrue($destination->refresh()->enabled);
    }

    public function test_failed_backup_job_updates_the_safe_destination_status(): void
    {
        Queue::fake();
        $destination = BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local vault',
            'enabled' => true,
            'config' => [
                'encryption_mode' => 'password',
                'password' => 'example-recovery-password',
            ],
        ]);

        (new RunFullBackup($destination->id))->failed(new \RuntimeException('Sensitive failure'));

        $this->assertSame(
            BackupDestinationRunStatus::Failed,
            $destination->refresh()->last_run_status,
        );
        $this->assertDatabaseMissing('backup_destinations', [
            'id' => $destination->id,
            'config' => 'Sensitive failure',
        ]);
    }
}
