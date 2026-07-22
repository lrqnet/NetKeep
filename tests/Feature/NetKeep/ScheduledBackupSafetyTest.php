<?php

namespace Tests\Feature\NetKeep;

use App\Models\BackupDestination;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduledBackupSafetyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        BackupDestination::query()->delete();
    }

    public function test_daily_backup_is_skipped_without_an_enabled_local_or_s3_destination(): void
    {
        $event = $this->backupEvent();

        $this->assertFalse($event->filtersPass($this->app));

        BackupDestination::query()->create([
            'type' => 'git',
            'name' => 'Private mirror',
            'enabled' => true,
            'config' => [],
        ]);
        BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Paused local vault',
            'enabled' => false,
            'config' => [],
        ]);

        $this->assertFalse($event->filtersPass($this->app));
    }

    public function test_daily_backup_runs_with_an_enabled_local_or_s3_destination(): void
    {
        $event = $this->backupEvent();
        BackupDestination::query()->create([
            'type' => 'local',
            'name' => 'Local vault',
            'enabled' => true,
            'config' => [],
        ]);

        $this->assertTrue($event->filtersPass($this->app));
    }

    private function backupEvent(): Event
    {
        $event = collect($this->app->make(Schedule::class)->events())
            ->first(fn (Event $candidate): bool => str_contains((string) $candidate->command, 'netkeep:backup'));

        $this->assertInstanceOf(Event::class, $event);

        return $event;
    }
}
