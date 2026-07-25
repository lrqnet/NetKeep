<?php

namespace Tests\Feature\NetKeep;

use App\Enums\CollectionRunStatus;
use App\Enums\CollectionTrigger;
use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\UserRole;
use App\Jobs\ReconcileCollectionRun;
use App\Jobs\RunDeviceDiagnostic;
use App\Models\CollectionRun;
use App\Models\Device;
use App\Models\User;
use App\Services\CollectionErrorClassifier;
use App\Services\CollectionRetentionService;
use App\Services\CollectionRunEventService;
use App\Services\CollectionTechnicalSanitizer;
use App\Services\CollectionTraceCrypto;
use App\Services\DeviceApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CollectionDiagnosticsTest extends TestCase
{
    use RefreshDatabase;

    private string $tracePath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tracePath = storage_path('framework/testing-collection-traces');
        File::deleteDirectory($this->tracePath);
        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('k', 32)),
            'netkeep.oxidized.token' => 'internal-reporter-token',
            'netkeep.diagnostics.trace_path' => $this->tracePath,
        ]);
        URL::forceRootUrl('http://app');
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tracePath);
        parent::tearDown();
    }

    public function test_timeline_serializer_never_exposes_technical_fields_to_operator_or_viewer(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Failed);
        app(CollectionRunEventService::class)->record(
            $run,
            'failure',
            level: 'error',
            technicalMessage: 'password=fictional-secret token fictional-token',
            context: ['password' => 'fictional-secret', 'driver' => 'ios'],
        );

        foreach ([UserRole::Operator, UserRole::Viewer] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $response = $this->actingAs($user)->getJson(route('collection-runs.events', $run));
            $response->assertOk()
                ->assertJsonMissingPath('events.0.technical_message')
                ->assertJsonMissingPath('events.0.context')
                ->assertJsonMissingPath('run.engine_reference');
            $this->assertStringNotContainsString('fictional-secret', $response->getContent());
            $this->assertStringNotContainsString('fictional-token', $response->getContent());
        }

        $administrator = User::factory()->create(['role' => UserRole::Administrator]);
        $this->actingAs($administrator)
            ->getJson(route('collection-runs.events', $run))
            ->assertOk()
            ->assertJsonPath('events.0.technical_message', 'password=[REDACTED]')
            ->assertJsonPath('events.0.context.password', '[REDACTED]')
            ->assertJsonPath('run.engine_reference', 'engine-test');
    }

    public function test_reporter_event_is_idempotent_and_node_fail_ends_the_active_run(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Running);
        $payload = [
            'event_id' => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
            'occurred_at' => now()->toIso8601String(),
            'event' => 'node_fail',
            'node_name' => $device->uuid,
            'node_ip' => $device->ip_address,
            'node_group' => 'default',
            'node_model' => 'IOS',
            'job_status' => 'failed',
            'job_time' => '1.2',
            'error_type' => 'Net::SSH::AuthenticationFailed',
            'error_reason' => 'password fictional-password was rejected',
        ];

        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson(route('internal.oxidized.events'), $payload)
            ->assertAccepted();
        $this->assertSame(CollectionRunStatus::Failed, $run->refresh()->status);
        $this->assertSame('authentication_failed', $run->error_code);
        $this->assertSame(1, $run->events()->where('event_id', $payload['event_id'])->count());
        $eventCount = $run->events()->count();

        $response = $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson(route('internal.oxidized.events'), $payload);
        $response->assertAccepted();
        $this->assertSame($eventCount, $run->events()->count());
        $this->assertStringNotContainsString('fictional-password', (string) $run->events()->value('technical_message'));
    }

    public function test_post_store_queues_immediate_git_reconciliation(): void
    {
        Queue::fake();
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Running);
        $payload = [
            'event_id' => 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
            'occurred_at' => now()->toIso8601String(),
            'event' => 'post_store',
            'node_name' => $device->uuid,
            'node_group' => 'default',
            'node_model' => 'IOS',
            'job_status' => 'success',
            'job_time' => '1.2',
        ];

        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson(route('internal.oxidized.events'), $payload)
            ->assertAccepted();

        Queue::assertPushed(
            ReconcileCollectionRun::class,
            fn (ReconcileCollectionRun $job): bool => $job->runId === $run->id,
        );
        $this->assertDatabaseHas('collection_run_events', [
            'collection_run_id' => $run->id,
            'code' => 'configuration_stored',
        ]);
    }

    public function test_reporter_endpoints_reject_invalid_host_token_unknown_device_and_large_payload(): void
    {
        $payload = [
            'event_id' => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
            'occurred_at' => now()->toIso8601String(),
            'event' => 'node_success',
            'node_name' => '11111111-2222-4333-8444-555555555555',
        ];

        $this->withHeader('Host', 'external.example')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson('http://external.example/internal/oxidized/events', $payload)
            ->assertStatus(400);
        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'wrong-token')
            ->postJson('/internal/oxidized/events', $payload)
            ->assertForbidden();
        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson('/internal/oxidized/events', $payload)
            ->assertNotFound();
        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson('/internal/oxidized/events', [
                ...$payload,
                'padding' => str_repeat('x', 9000),
            ])
            ->assertStatus(413);
    }

    public function test_reporter_ignores_a_known_device_without_an_active_run(): void
    {
        $device = $this->approvedDevice();
        $payload = [
            'event_id' => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
            'occurred_at' => now()->toIso8601String(),
            'event' => 'node_success',
            'node_name' => $device->uuid,
        ];

        $this->withHeader('Host', 'app')
            ->withHeader('X-NetKeep-Token', 'internal-reporter-token')
            ->postJson(route('internal.oxidized.events'), $payload)
            ->assertAccepted()
            ->assertJsonPath('accepted', false);
        $this->assertDatabaseCount('collection_run_events', 0);
    }

    public function test_reporter_streams_a_trace_into_encrypted_storage(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Running, CollectionTrigger::Diagnostic);
        $trace = "fictional-marker\npassword fictional-secret\n";

        $response = $this->call(
            'PUT',
            route('internal.oxidized.diagnostics.trace', $device->uuid),
            server: [
                'HTTP_HOST' => 'app',
                'HTTP_X_NETKEEP_TOKEN' => 'internal-reporter-token',
                'CONTENT_TYPE' => 'application/octet-stream',
                'CONTENT_LENGTH' => strlen($trace),
            ],
            content: $trace,
        );

        $response->assertCreated()->assertJsonPath('accepted', true);
        $artifact = $run->artifacts()->where('type', 'raw_trace')->firstOrFail();
        $this->assertSame($trace, app(CollectionTraceCrypto::class)->decrypt($artifact));
        $this->assertStringNotContainsString('fictional-marker', File::get($this->tracePath.'/'.$artifact->encrypted_path));
        $this->assertDatabaseHas('collection_run_events', [
            'collection_run_id' => $run->id,
            'code' => 'trace_stored',
        ]);
    }

    public function test_trace_storage_truncates_plaintext_at_the_security_limit(): void
    {
        config(['netkeep.diagnostics.trace_max_bytes' => 16]);
        $run = $this->collectionRun($this->approvedDevice(), CollectionRunStatus::Failed, CollectionTrigger::Diagnostic);
        $stream = fopen('php://temp', 'w+b');
        $this->assertIsResource($stream);
        fwrite($stream, str_repeat('x', 32));
        rewind($stream);

        $artifact = app(CollectionTraceCrypto::class)->store($run, $stream);
        fclose($stream);

        $this->assertSame(16, $artifact->size);
        $this->assertTrue($artifact->truncated);
        $this->assertSame(str_repeat('x', 16), app(CollectionTraceCrypto::class)->decrypt($artifact));
    }

    public function test_trace_crypto_roundtrip_detects_tampering_and_retention_purges_records(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Failed, CollectionTrigger::Diagnostic);
        $stream = fopen('php://temp', 'w+b');
        $this->assertIsResource($stream);
        fwrite($stream, "fictional-marker\npassword fictional-secret\n");
        rewind($stream);
        $artifact = app(CollectionTraceCrypto::class)->store($run, $stream);
        fclose($stream);

        $this->assertSame("fictional-marker\npassword fictional-secret\n", app(CollectionTraceCrypto::class)->decrypt($artifact));
        $stored = File::get($this->tracePath.'/'.$artifact->encrypted_path);
        $this->assertStringNotContainsString('fictional-marker', $stored);
        File::append($this->tracePath.'/'.$artifact->encrypted_path, 'tampered');
        $this->expectExceptionMessage('trace_checksum_mismatch');
        app(CollectionTraceCrypto::class)->decrypt($artifact);
    }

    public function test_expired_trace_and_terminal_run_are_pruned_without_audit_deletion(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Failed, CollectionTrigger::Diagnostic);
        $run->forceFill(['finished_at' => now()->subDays(31)])->save();
        app(CollectionRunEventService::class)->record($run, 'failure');
        $stream = fopen('php://temp', 'w+b');
        $this->assertIsResource($stream);
        fwrite($stream, 'fictional-marker');
        rewind($stream);
        $artifact = app(CollectionTraceCrypto::class)->store($run, $stream);
        fclose($stream);
        $artifact->forceFill(['expires_at' => now()->subMinute()])->save();

        $result = app(CollectionRetentionService::class)->prune();

        $this->assertSame(1, $result['artifacts']);
        $this->assertSame(1, $result['runs']);
        $this->assertDatabaseMissing('collection_runs', ['id' => $run->id]);
        $this->assertFileDoesNotExist($this->tracePath.'/'.$artifact->encrypted_path);
    }

    public function test_diagnostic_requires_privileged_role_recent_password_confirmation_and_exact_text(): void
    {
        Queue::fake();
        $device = $this->approvedDevice();
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($operator)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.diagnostics', $device), ['risk_confirmation' => 'DIAGNOSTIC'])
            ->assertForbidden();
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => now()->subMinutes(6)->timestamp])
            ->post(route('devices.diagnostics', $device), ['risk_confirmation' => 'DIAGNOSTIC'])
            ->assertRedirect(route('password.confirm'));
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.diagnostics', $device), ['risk_confirmation' => 'diagnostic'])
            ->assertSessionHasErrors('risk_confirmation');
        foreach (range(1, 10) as $attempt) {
            RateLimiter::hit(sha1((string) $owner->id), 600);
        }
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.diagnostics', $device), ['risk_confirmation' => 'DIAGNOSTIC'])
            ->assertRedirect();

        $run = CollectionRun::query()->where('trigger', CollectionTrigger::Diagnostic)->firstOrFail();
        $this->assertSame(CollectionRunStatus::Dispatched, $run->status);
        Queue::assertPushed(RunDeviceDiagnostic::class, fn (RunDeviceDiagnostic $job): bool => $job->runId === $run->id);
        $this->assertDatabaseHas('audit_events', ['action' => 'device.diagnostic_requested']);
    }

    public function test_trace_view_and_download_require_privilege_and_recent_password_and_are_audited(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Succeeded, CollectionTrigger::Diagnostic);
        $stream = fopen('php://temp', 'w+b');
        $this->assertIsResource($stream);
        fwrite($stream, '<script>fictional-marker</script>');
        rewind($stream);
        app(CollectionTraceCrypto::class)->store($run, $stream);
        fclose($stream);
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($viewer)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route('collection-runs.trace', $run))
            ->assertForbidden();
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route('collection-runs.trace', $run))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('collection-runs/trace')
                ->where('trace', '<script>fictional-marker</script>'));
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route('collection-runs.trace.download', $run))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertSeeText('fictional-marker');
        $this->assertDatabaseHas('audit_events', ['action' => 'collection.trace_viewed']);
        $this->assertDatabaseHas('audit_events', ['action' => 'collection.trace_downloaded']);
    }

    public function test_terminal_sse_respects_cursor_role_filtering_and_stream_limit(): void
    {
        $device = $this->approvedDevice();
        $run = $this->collectionRun($device, CollectionRunStatus::Failed);
        $event = app(CollectionRunEventService::class)->record(
            $run,
            'failure',
            technicalMessage: 'technical-only',
        );
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);

        $response = $this->actingAs($viewer)->get(route('collection-runs.stream', $run));
        $response->assertOk()
            ->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8')
            ->assertHeader('X-Accel-Buffering', 'no');
        $content = $response->streamedContent();
        $this->assertStringContainsString('event: collection.event', $content);
        $this->assertStringContainsString('id: '.$event->id, $content);
        $this->assertStringContainsString('event: heartbeat', $content);
        $this->assertStringContainsString('event: end', $content);
        $this->assertStringNotContainsString('technical-only', $content);

        $reconnected = $this->actingAs($viewer)
            ->withHeader('Last-Event-ID', (string) $event->id)
            ->get(route('collection-runs.stream', $run));
        $reconnected->assertOk();
        $this->assertStringNotContainsString('event: collection.event', $reconnected->streamedContent());

        Cache::put("collection-stream:{$viewer->id}:{$run->id}", 2, 60);
        $this->actingAs($viewer)
            ->get(route('collection-runs.stream', $run))
            ->assertStatus(429);
    }

    public function test_sanitizer_removes_url_userinfo_keys_communities_and_private_keys(): void
    {
        $message = <<<'TEXT'
https://user:fictional-password@example.test password=fictional-password community public enable secretvalue
-----BEGIN PRIVATE KEY-----
fictional-private-key
-----END PRIVATE KEY-----
TEXT;
        $sanitized = app(CollectionTechnicalSanitizer::class)->message($message);

        $this->assertNotNull($sanitized);
        $this->assertStringNotContainsString('fictional-password', $sanitized);
        $this->assertStringNotContainsString('fictional-private-key', $sanitized);
        $this->assertStringNotContainsString('secretvalue', $sanitized);
        $this->assertLessThanOrEqual(2048, strlen($sanitized));
    }

    #[DataProvider('knownCollectionErrors')]
    public function test_error_classifier_maps_known_failures(string $type, string $reason, string $expected): void
    {
        $this->assertSame($expected, app(CollectionErrorClassifier::class)->classify($type, $reason));
    }

    /** @return array<string, array{string,string,string}> */
    public static function knownCollectionErrors(): array
    {
        return [
            'authentication' => ['Net::SSH::AuthenticationFailed', 'login failed', 'authentication_failed'],
            'refused' => ['Errno::ECONNREFUSED', 'connection refused', 'connection_refused'],
            'connection timeout' => ['Timeout::Error', 'connection timed out', 'connection_timeout'],
            'collection timelimit' => ['Oxidized::Timeout', 'timelimit reached', 'collection_timelimit'],
            'prompt' => ['RuntimeError', 'prompt not detected', 'prompt_not_detected'],
            'host key' => ['Net::SSH::HostKeyMismatch', 'host key changed', 'ssh_host_key_changed'],
            'driver' => ['Oxidized::ModelError', 'driver command failed', 'driver_error'],
            'engine' => ['RuntimeError', 'unexpected failure', 'engine_failure'],
        ];
    }

    private function approvedDevice(): Device
    {
        $device = Device::query()->create([
            'name' => 'diagnostic-device',
            'ip_address' => '198.51.100.70',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
            'approved_resolved_addresses' => ['198.51.100.70'],
            'ssh_host_key' => '198.51.100.70 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFictional',
            'ssh_host_key_fingerprint' => 'SHA256:fictional',
        ]);
        $device->forceFill([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ])->save();

        return $device;
    }

    private function collectionRun(
        Device $device,
        CollectionRunStatus $status,
        CollectionTrigger $trigger = CollectionTrigger::Manual,
    ): CollectionRun {
        return CollectionRun::query()->create([
            'device_id' => $device->id,
            'trigger' => $trigger,
            'status' => $status,
            'attempt' => 1,
            'priority' => 100,
            'scheduled_for' => now()->subMinute(),
            'dispatched_at' => now()->subSeconds(30),
            'started_at' => now()->subSeconds(20),
            'finished_at' => $status->isPending() ? null : now(),
            'engine_reference' => 'engine-test',
        ]);
    }
}
