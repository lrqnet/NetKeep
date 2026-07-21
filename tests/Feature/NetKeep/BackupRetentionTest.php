<?php

namespace Tests\Feature\NetKeep;

use App\Models\BackupArchive;
use App\Models\BackupDestination;
use App\Models\Organization;
use App\Services\BackupRetentionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class BackupRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_full_backup_retention_never_touches_git_history(): void
    {
        $root = storage_path('framework/testing-retention');
        config(['netkeep.backup_path' => $root]);
        File::deleteDirectory($root);
        File::ensureDirectoryExists($root.'/netkeep/2026/01');
        File::put($root.'/netkeep/2026/01/old.nkb', 'encrypted');
        File::ensureDirectoryExists($root.'/git/repository/.git');
        File::put($root.'/git/repository/keep', 'history');
        Organization::query()->firstOrFail()->update([
            'settings' => ['full_backup_retention_days' => 30],
        ]);
        $destination = BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local',
            'enabled' => true,
            'config' => ['encryption_mode' => 'password', 'password' => 'long-recovery-password'],
        ]);
        BackupArchive::query()->create([
            'backup_destination_id' => $destination->id,
            'status' => 'completed',
            'path' => 'netkeep/2026/01/old.nkb',
            'encryption_mode' => 'password',
            'size' => 9,
            'started_at' => now()->subDays(40),
            'completed_at' => now()->subDays(40),
        ]);

        $this->assertSame(1, app(BackupRetentionService::class)->prune());
        $this->assertFileDoesNotExist($root.'/netkeep/2026/01/old.nkb');
        $this->assertFileExists($root.'/git/repository/keep');
        $this->assertDatabaseCount('backup_archives', 0);
    }
}
