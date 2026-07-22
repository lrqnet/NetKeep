<?php

use App\Models\BackupDestination;
use Illuminate\Support\Facades\Schedule;

Schedule::command('inventory:sync')->everyFiveMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:reconcile-backups')->everyMinute()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:dispatch-collections')->everyMinute()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:check-overdue')->everyFiveMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:backup')
    ->dailyAt('02:30')
    ->when(fn (): bool => BackupDestination::query()
        ->where('enabled', true)
        ->whereIn('type', ['s3', 'local'])
        ->exists())
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('netkeep:mirror-git')->everyFifteenMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:check-updates')->everyFiveMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:auto-update')->everyFiveMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:reconcile-updates')->everyMinute()->withoutOverlapping()->onOneServer();
Schedule::command('netkeep:prune-backups')->dailyAt('03:30')->withoutOverlapping()->onOneServer();
Schedule::command('queue:prune-batches --hours=72')->daily();
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
