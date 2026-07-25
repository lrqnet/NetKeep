<?php

namespace Tests\Feature\NetKeep;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\RiskLevel;
use App\Enums\UserRole;
use App\Exceptions\GitRepositoryUnavailable;
use App\Jobs\DispatchCollections;
use App\Models\BackupRun;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Models\Organization;
use App\Models\Site;
use App\Models\User;
use App\Services\BackupReconciler;
use App\Services\CollectionOrchestrator;
use App\Services\CollectionRequestService;
use App\Services\CollectionRiskService;
use App\Services\CollectionRunService;
use App\Services\DeviceApprovalService;
use App\Services\GitHistory;
use App\Services\OxidizedClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Mockery;
use Tests\TestCase;

class CollectionControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_one_pending_collection_can_exist_per_device(): void
    {
        $device = $this->approvedDevice('198.51.100.31');
        $collections = app(CollectionRequestService::class);

        $first = $collections->request($device, CollectionTrigger::Manual);
        $second = $collections->request($device, CollectionTrigger::Scheduled);

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('collection_runs', 1);
    }

    public function test_manual_collection_respects_the_five_minute_cooldown(): void
    {
        $device = $this->approvedDevice('198.51.100.32');
        $device->update(['manual_cooldown_until' => now()->addMinutes(5)]);

        $this->expectException(ValidationException::class);
        app(CollectionRequestService::class)->request($device, CollectionTrigger::Manual);
    }

    public function test_manual_http_request_kicks_the_dispatcher_without_waiting_for_the_scheduler(): void
    {
        Queue::fake();
        $device = $this->approvedDevice('198.51.100.62');
        $user = User::factory()->create(['role' => UserRole::Operator]);

        $this->actingAs($user)
            ->post(route('devices.collect', $device))
            ->assertRedirect();

        Queue::assertPushed(DispatchCollections::class);
        $this->assertDatabaseHas('collection_runs', [
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Manual->value,
            'status' => CollectionRunStatus::Queued->value,
        ]);
    }

    public function test_failed_collections_retry_after_one_five_and_fifteen_minutes(): void
    {
        $device = $this->approvedDevice('198.51.100.33');
        $runs = app(CollectionRunService::class);
        $expectedDelays = [60, 300, 900];
        $run = CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Scheduled,
            'status' => CollectionRunStatus::Running,
            'attempt' => 1,
            'scheduled_for' => now(),
            'started_at' => now(),
        ]);

        foreach ($expectedDelays as $delay) {
            $before = now();
            $runs->fail($run, 'simulated_failure');
            $retry = CollectionRun::query()
                ->where('parent_id', $run->id)
                ->firstOrFail();
            $this->assertSame(CollectionRunStatus::Cooldown, $retry->status);
            $this->assertTrue(
                $retry->scheduled_for->between(
                    $before->copy()->addSeconds($delay - 1),
                    $before->copy()->addSeconds($delay + 2),
                ),
            );
            $retry->update([
                'status' => CollectionRunStatus::Running,
                'started_at' => now(),
            ]);
            $run = $retry;
        }

        $runs->fail($run, 'simulated_failure');
        $this->assertFalse(CollectionRun::query()->where('parent_id', $run->id)->exists());
    }

    public function test_dispatch_enforces_global_and_per_site_concurrency(): void
    {
        Queue::fake();
        $organization = Organization::query()->firstOrFail();
        $organization->update([
            'settings' => array_merge($organization->settings ?? [], ['collection_concurrency' => 5]),
        ]);
        $site = Site::query()->create(['name' => 'POP']);
        for ($index = 1; $index <= 3; $index++) {
            $device = $this->approvedDevice("198.51.100.4{$index}", $site->id);
            $this->queuedRun($device);
        }
        for ($index = 1; $index <= 4; $index++) {
            $device = $this->approvedDevice("203.0.113.5{$index}");
            $this->queuedRun($device);
        }

        app(CollectionOrchestrator::class)->tick();

        $this->assertSame(5, CollectionRun::query()->where('status', CollectionRunStatus::Dispatched)->count());
        $this->assertSame(
            2,
            CollectionRun::query()
                ->join('devices', 'devices.id', '=', 'collection_runs.device_id')
                ->where('devices.site_id', $site->id)
                ->where('collection_runs.status', CollectionRunStatus::Dispatched)
                ->count(),
        );
    }

    public function test_success_without_a_git_change_completes_the_collection(): void
    {
        $device = $this->approvedDevice('198.51.100.60');
        $run = CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Manual,
            'status' => CollectionRunStatus::Running,
            'attempt' => 1,
            'scheduled_for' => now()->subMinute(),
            'started_at' => now()->subSeconds(10),
        ]);
        BackupRun::query()->create([
            'device_id' => $device->id,
            'status' => 'completed',
            'started_at' => now()->subDay(),
            'finished_at' => now()->subDay(),
            'git_commit' => str_repeat('a', 40),
            'changed' => false,
        ]);
        $history = Mockery::mock(GitHistory::class);
        $history->shouldReceive('versions')->andReturn([[
            'hash' => str_repeat('a', 40),
            'date' => now()->subDay()->toIso8601String(),
            'author' => 'NetKeep',
            'subject' => 'backup',
        ]]);
        $oxidized = Mockery::mock(OxidizedClient::class);
        $oxidized->shouldReceive('nodes')->once()->andReturn([[
            'name' => $device->uuid,
            'last' => ['status' => 'success', 'end' => now()->toIso8601String()],
        ]]);

        app(BackupReconciler::class)->reconcile($history, $oxidized);

        $this->assertSame(CollectionRunStatus::Succeeded, $run->refresh()->status);
        $this->assertDatabaseHas('backup_runs', [
            'collection_run_id' => $run->id,
            'changed' => false,
        ]);
    }

    public function test_first_success_without_a_git_version_fails_closed(): void
    {
        $device = $this->approvedDevice('198.51.100.63');
        $run = CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Manual,
            'status' => CollectionRunStatus::Running,
            'attempt' => 1,
            'scheduled_for' => now()->subMinute(),
            'started_at' => now()->subSeconds(10),
        ]);
        $history = Mockery::mock(GitHistory::class);
        $history->shouldReceive('versions')->once()->andReturn([]);
        $oxidized = Mockery::mock(OxidizedClient::class);
        $oxidized->shouldReceive('nodes')->once()->andReturn([[
            'name' => $device->uuid,
            'last' => ['status' => 'success', 'end' => now()->toIso8601String()],
        ]]);

        app(BackupReconciler::class)->reconcile($history, $oxidized);

        $this->assertSame(CollectionRunStatus::Failed, $run->refresh()->status);
        $this->assertSame('configuration_not_persisted', $run->error_code);
        $this->assertSame(DeviceStatus::Failing, $device->refresh()->status);
        $this->assertDatabaseMissing('backup_runs', ['collection_run_id' => $run->id]);
        $this->assertDatabaseHas('collection_run_events', [
            'collection_run_id' => $run->id,
            'code' => 'failure',
        ]);
    }

    public function test_unavailable_git_history_fails_without_exposing_process_details(): void
    {
        $device = $this->approvedDevice('198.51.100.64');
        $run = CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Manual,
            'status' => CollectionRunStatus::Running,
            'attempt' => 1,
            'scheduled_for' => now()->subMinute(),
            'started_at' => now()->subSeconds(10),
        ]);
        $history = Mockery::mock(GitHistory::class);
        $history->shouldReceive('versions')
            ->once()
            ->andThrow(new GitRepositoryUnavailable);
        $oxidized = Mockery::mock(OxidizedClient::class);
        $oxidized->shouldReceive('nodes')->once()->andReturn([[
            'name' => $device->uuid,
            'last' => ['status' => 'success', 'end' => now()->toIso8601String()],
        ]]);

        app(BackupReconciler::class)->reconcile($history, $oxidized);

        $this->assertSame(CollectionRunStatus::Failed, $run->refresh()->status);
        $this->assertSame('configuration_history_unavailable', $run->error_code);
        $event = $run->events()->where('code', 'failure')->firstOrFail();
        $this->assertNull($event->technical_message);
        $this->assertSame(
            ['error_code' => 'configuration_history_unavailable'],
            $event->context,
        );
    }

    public function test_collection_risk_boundaries_match_safe_mode_policy(): void
    {
        $risks = app(CollectionRiskService::class);

        $this->assertSame(RiskLevel::Critical, $risks->interval(899));
        $this->assertSame(RiskLevel::Warning, $risks->interval(900));
        $this->assertSame(RiskLevel::Normal, $risks->interval(3600));
        $this->assertSame(RiskLevel::Warning, $risks->concurrency(6));
        $this->assertSame(RiskLevel::Critical, $risks->concurrency(11));
        $this->assertSame(RiskLevel::Warning, $risks->timeout(61));
        $this->assertSame(RiskLevel::Critical, $risks->timeout(181));
    }

    private function approvedDevice(string $ip, ?int $siteId = null): Device
    {
        $device = Device::query()->create([
            'name' => 'device-'.str_replace(['.', ':'], '-', $ip),
            'ip_address' => $ip,
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'site_id' => $siteId,
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
            'approved_resolved_addresses' => [$ip],
            'next_collection_at' => now()->addHour(),
        ]);
        $device->forceFill([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ])->save();

        return $device;
    }

    private function queuedRun(Device $device): CollectionRun
    {
        return CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => CollectionTrigger::Scheduled,
            'status' => CollectionRunStatus::Queued,
            'attempt' => 1,
            'scheduled_for' => now(),
        ]);
    }
}
