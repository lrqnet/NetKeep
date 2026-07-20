<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\UserRole;
use App\Jobs\TestCustomModel;
use App\Models\CustomModel;
use App\Models\Device;
use App\Models\User;
use App\Services\CustomModelPublisher;
use App\Services\DeviceApprovalService;
use App\Services\KnownHostsWriter;
use App\Services\OxidizedClient;
use App\Services\SandboxOxidizedClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class CustomModelTest extends TestCase
{
    use RefreshDatabase;

    private string $sandboxPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sandboxPath = storage_path('framework/testing-sandbox');
        File::deleteDirectory($this->sandboxPath);
        File::ensureDirectoryExists($this->sandboxPath);
        config(['netkeep.sandbox.config_path' => $this->sandboxPath]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->sandboxPath);
        parent::tearDown();
    }

    public function test_owner_can_queue_a_validated_model_test_on_an_associated_device(): void
    {
        Queue::fake();
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $model = $this->model($owner);
        $device = $this->device($model->slug);

        $this->mock(CustomModelPublisher::class)
            ->shouldReceive('validate')
            ->once()
            ->andReturnNull();

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('models.test', $model), ['device_id' => $device->id])
            ->assertRedirect();

        Queue::assertPushed(
            TestCustomModel::class,
            fn (TestCustomModel $job): bool => $job->modelId === $model->id
                && $job->deviceId === $device->id,
        );
        $this->assertDatabaseHas('audit_events', [
            'action' => 'model.test_queued',
            'subject_id' => $model->id,
        ]);
    }

    public function test_model_test_rejects_a_device_using_another_driver(): void
    {
        Queue::fake();
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $model = $this->model($owner);
        $device = $this->device('ios');

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('models.test', $model), ['device_id' => $device->id])
            ->assertUnprocessable();

        Queue::assertNothingPushed();
    }

    public function test_model_test_restores_the_previous_file_after_a_successful_collection(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $model = $this->model($owner);
        $device = $this->device($model->slug);

        $publisher = Mockery::mock(CustomModelPublisher::class);
        $publisher->shouldReceive('validate')->once()->andReturnNull();
        $publisher->shouldReceive('publishTo')->once()->andReturn('previous Ruby');
        $publisher->shouldReceive('rollbackFrom')->once()->withArgs(
            fn (CustomModel $candidate, ?string $previous, string $path): bool => $candidate->is($model)
                && $previous === 'previous Ruby'
                && $path === (string) config('netkeep.sandbox.config_path'),
        );

        $oxidized = Mockery::mock(SandboxOxidizedClient::class);
        $oxidized->shouldReceive('reload')->twice()->andReturnTrue();
        $oxidized->shouldReceive('collect')->once()->with($device->uuid)->andReturnTrue();
        $oxidized->shouldReceive('nodes')->once()->andReturn([[
            'name' => $device->uuid,
            'last' => [
                'status' => 'success',
                'end' => now()->addSecond()->toIso8601String(),
            ],
        ]]);

        (new TestCustomModel($model->id, $device->id))->handle($publisher, $oxidized);

        $this->assertSame('passed', $model->refresh()->last_test_status);
        $this->assertNotNull($model->last_tested_at);
    }

    public function test_model_publication_invalidates_devices_using_the_driver(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $model = $this->model($owner);
        $device = $this->device($model->slug);

        $publisher = $this->mock(CustomModelPublisher::class);
        $publisher->shouldReceive('validate')
            ->once()
            ->andReturnNull();
        $publisher->shouldReceive('publish')
            ->once()
            ->andReturnNull();
        $this->mock(KnownHostsWriter::class)
            ->shouldReceive('write')
            ->once();
        $this->mock(OxidizedClient::class)
            ->shouldReceive('reload')
            ->twice()
            ->andReturnTrue();

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('models.publish', $model))
            ->assertRedirect();

        $device->refresh();
        $this->assertFalse($device->enabled);
        $this->assertSame(DeviceApprovalStatus::Pending, $device->approval_status);
        $this->assertSame($model->id, $device->custom_model_id);
        $this->assertSame('published', $model->refresh()->status);
    }

    public function test_draft_custom_model_cannot_be_approved_for_collection(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $model = $this->model($owner);
        $device = $this->device($model->slug);
        app(DeviceApprovalService::class)->invalidate($device);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.approve', $device))
            ->assertUnprocessable();

        $this->assertSame(DeviceApprovalStatus::Pending, $device->refresh()->approval_status);
    }

    private function model(User $author): CustomModel
    {
        return CustomModel::query()->create([
            'name' => 'Vendor Edge',
            'slug' => 'vendor_edge',
            'source' => 'guided',
            'ruby_source' => "class VendorEdge < Oxidized::Model\nend\n",
            'created_by' => $author->id,
        ]);
    }

    private function device(string $driver): Device
    {
        $device = Device::query()->create([
            'name' => 'edge-test',
            'ip_address' => '198.51.100.20',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => $driver,
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
            'approved_resolved_addresses' => ['198.51.100.20'],
            'ssh_host_key' => '198.51.100.20 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
            'ssh_host_key_fingerprint' => 'SHA256:test',
        ]);
        $device->forceFill([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ])->save();

        return $device;
    }
}
