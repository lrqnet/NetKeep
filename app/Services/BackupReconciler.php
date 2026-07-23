<?php

namespace App\Services;

use App\Enums\CollectionRunStatus;
use App\Enums\DeviceStatus;
use App\Jobs\SendAlert;
use App\Models\BackupRun;
use App\Models\CollectionRun;
use App\Models\Device;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class BackupReconciler
{
    /**
     * @return array{created:int,failed:int,recovered:int}
     */
    public function reconcile(GitHistory $history, OxidizedClient $oxidized): array
    {
        $created = 0;
        $failed = 0;
        $recovered = 0;
        $nodes = collect($oxidized->nodes())->keyBy(function (mixed $node): string {
            return is_array($node) ? (string) ($node['name'] ?? '') : '';
        });

        Device::query()
            ->where('enabled', true)
            ->with('group:id,name')
            ->chunkById(250, function ($devices) use ($history, $nodes, &$created, &$failed, &$recovered): void {
                foreach ($devices as $device) {
                    $node = $nodes->get($device->uuid);
                    $nodeStatus = is_array($node)
                        ? strtolower((string) (data_get($node, 'last.status') ?? data_get($node, 'status') ?? ''))
                        : '';
                    $engineEndedAt = $this->engineEndedAt($node);
                    $running = $device->collectionRuns()
                        ->where('status', CollectionRunStatus::Running)
                        ->latest('id')
                        ->first();
                    $belongsToRunning = $running
                        && $engineEndedAt
                        && $running->started_at
                        && $engineEndedAt->greaterThanOrEqualTo($running->started_at);

                    if ($belongsToRunning && in_array($nodeStatus, ['error', 'failed', 'no_connection'], true)) {
                        if ($device->status !== DeviceStatus::Failing) {
                            $failed++;
                            SendAlert::dispatch('failure', 'netkeep.alerts.device_failed', ['device_id' => $device->id, 'device' => $device->name]);
                        }
                        $device->update([
                            'status' => DeviceStatus::Failing,
                            'last_error' => __('netkeep.devices.collection_failed_safe'),
                        ]);
                        app(CollectionRunService::class)->fail($running, 'engine_failure');

                        continue;
                    }

                    $latest = $history->versions($device, 1)[0] ?? null;
                    if ($belongsToRunning && in_array($nodeStatus, ['success', 'done', 'unchanged', 'no_change'], true)) {
                        $this->recordCollectionResult(
                            $device,
                            $running,
                            $latest,
                            $engineEndedAt,
                            $created,
                            $recovered,
                        );

                        continue;
                    }

                    if (! $latest || BackupRun::query()
                        ->where('device_id', $device->id)
                        ->where('git_commit', $latest['hash'])
                        ->exists()) {
                        continue;
                    }

                    $hadPrevious = $device->backupRuns()->whereNotNull('git_commit')->exists();
                    $wasFailing = $device->status === DeviceStatus::Failing;
                    BackupRun::query()->create([
                        'device_id' => $device->id,
                        'status' => 'completed',
                        'started_at' => $latest['date'],
                        'finished_at' => $latest['date'],
                        'git_commit' => $latest['hash'],
                        'changed' => $hadPrevious,
                        'metadata' => ['subject' => $latest['subject'], 'author' => $latest['author']],
                    ]);
                    $device->update([
                        'status' => DeviceStatus::Healthy,
                        'last_backup_at' => $latest['date'],
                        'last_success_at' => $latest['date'],
                        'overdue_alerted_at' => null,
                        'last_error' => null,
                    ]);
                    if ($running && Carbon::parse($latest['date'])->greaterThanOrEqualTo($running->started_at)) {
                        app(CollectionRunService::class)->succeed($running);
                    }
                    $created++;

                    if ($wasFailing) {
                        $recovered++;
                        SendAlert::dispatch('recovery', 'netkeep.alerts.device_recovered', ['device_id' => $device->id, 'device' => $device->name]);
                    }
                    if ($hadPrevious) {
                        SendAlert::dispatch('change', 'netkeep.alerts.device_changed', [
                            'device_id' => $device->id,
                            'device' => $device->name,
                            'git_commit' => $latest['hash'],
                        ]);
                    }
                }
            });

        CollectionRun::query()
            ->where('status', CollectionRunStatus::Running)
            ->with('device')
            ->where('started_at', '<=', now()->subMinute())
            ->chunkById(100, function ($runs): void {
                foreach ($runs as $run) {
                    $deadline = $run->started_at?->addSeconds($run->device->timeout + 60);
                    if ($deadline?->isPast()) {
                        app(CollectionRunService::class)->fail($run, 'collection_timelimit');
                    }
                }
            });

        return compact('created', 'failed', 'recovered');
    }

    /**
     * @param  array{hash:string,date:string,author:string,subject:string}|null  $latest
     */
    private function recordCollectionResult(
        Device $device,
        CollectionRun $running,
        ?array $latest,
        CarbonInterface $engineEndedAt,
        int &$created,
        int &$recovered,
    ): void {
        if (BackupRun::query()->where('collection_run_id', $running->id)->exists()) {
            app(CollectionRunService::class)->succeed($running);

            return;
        }

        $latestDate = $latest ? Carbon::parse($latest['date']) : null;
        $commitBelongsToRun = $latest
            && $latestDate
            && $running->started_at
            && $latestDate->greaterThanOrEqualTo($running->started_at);
        $commitWasRecorded = $latest && BackupRun::query()
            ->where('device_id', $device->id)
            ->where('git_commit', $latest['hash'])
            ->exists();
        $hadPreviousCommit = $device->backupRuns()->whereNotNull('git_commit')->exists();
        $changed = $commitBelongsToRun && ! $commitWasRecorded && $hadPreviousCommit;
        $wasFailing = $device->status === DeviceStatus::Failing;

        BackupRun::query()->create([
            'device_id' => $device->id,
            'collection_run_id' => $running->id,
            'status' => 'completed',
            'started_at' => $running->started_at,
            'finished_at' => $engineEndedAt,
            'git_commit' => $latest['hash'] ?? null,
            'changed' => $changed,
            'metadata' => array_filter([
                'subject' => $commitBelongsToRun ? $latest['subject'] : null,
                'author' => $commitBelongsToRun ? $latest['author'] : null,
                'engine_status' => 'success',
                'configuration_changed' => $commitBelongsToRun && ! $commitWasRecorded,
            ], static fn (mixed $value): bool => $value !== null),
        ]);
        $device->update([
            'status' => DeviceStatus::Healthy,
            'last_backup_at' => $engineEndedAt,
            'last_success_at' => $engineEndedAt,
            'overdue_alerted_at' => null,
            'last_error' => null,
        ]);
        app(CollectionRunService::class)->succeed($running);
        $created++;

        if ($wasFailing) {
            $recovered++;
            SendAlert::dispatch('recovery', 'netkeep.alerts.device_recovered', [
                'device_id' => $device->id,
                'device' => $device->name,
            ]);
        }
        if ($changed) {
            SendAlert::dispatch('change', 'netkeep.alerts.device_changed', [
                'device_id' => $device->id,
                'device' => $device->name,
                'git_commit' => $latest['hash'],
            ]);
        }
    }

    private function engineEndedAt(mixed $node): ?CarbonInterface
    {
        if (! is_array($node)) {
            return null;
        }

        $ended = data_get($node, 'last.end');
        if (! is_string($ended) || trim($ended) === '') {
            return null;
        }

        try {
            return Carbon::parse($ended);
        } catch (\Throwable) {
            return null;
        }
    }
}
