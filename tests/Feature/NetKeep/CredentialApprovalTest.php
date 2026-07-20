<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\UserRole;
use App\Models\CredentialProfile;
use App\Models\Device;
use App\Models\User;
use App\Services\DeviceApprovalService;
use App\Services\KnownHostsWriter;
use App\Services\OxidizedClient;
use App\Services\OxidizedCredentialMaterializer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CredentialApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_sensitive_credential_change_invalidates_associated_devices(): void
    {
        $administrator = User::factory()->create(['role' => UserRole::Administrator]);
        $credential = CredentialProfile::query()->create([
            'name' => 'Network access',
            'username' => 'backup',
            'password' => 'original-password',
            'created_by' => $administrator->id,
        ]);
        $device = Device::query()->create([
            'name' => 'edge-credential-test',
            'ip_address' => '198.51.100.40',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'credential_profile_id' => $credential->id,
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
        ]);
        $device->forceFill([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
            'approved_by' => $administrator->id,
            'approved_at' => now(),
        ])->save();

        $this->mock(KnownHostsWriter::class)
            ->shouldReceive('write')
            ->once();
        $this->mock(OxidizedCredentialMaterializer::class)
            ->shouldReceive('sync')
            ->once();
        $this->mock(OxidizedClient::class)
            ->shouldReceive('reload')
            ->once()
            ->andReturnTrue();

        $this->actingAs($administrator)
            ->patch(route('credentials.update', $credential), [
                'name' => $credential->name,
                'username' => $credential->username,
                'password' => 'rotated-password',
            ])
            ->assertRedirect();

        $device->refresh();
        $this->assertFalse($device->enabled);
        $this->assertSame(DeviceApprovalStatus::Pending, $device->approval_status);
        $this->assertNull($device->approval_fingerprint);
        $this->assertDatabaseHas('audit_events', [
            'action' => 'credential.updated',
            'subject_id' => $credential->id,
        ]);
    }

    public function test_non_sensitive_credential_metadata_change_preserves_approval(): void
    {
        $administrator = User::factory()->create(['role' => UserRole::Administrator]);
        $credential = CredentialProfile::query()->create([
            'name' => 'Network access',
            'username' => 'backup',
            'password' => 'original-password',
            'created_by' => $administrator->id,
        ]);
        $device = Device::query()->create([
            'name' => 'edge-credential-notes',
            'ip_address' => '198.51.100.41',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'credential_profile_id' => $credential->id,
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
        ]);
        $fingerprint = app(DeviceApprovalService::class)->fingerprint($device);
        $device->forceFill([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approval_fingerprint' => $fingerprint,
            'approved_by' => $administrator->id,
            'approved_at' => now(),
        ])->save();

        $this->mock(KnownHostsWriter::class)
            ->shouldNotReceive('write');
        $this->mock(OxidizedCredentialMaterializer::class)
            ->shouldReceive('sync')
            ->once();
        $this->mock(OxidizedClient::class)
            ->shouldReceive('reload')
            ->once()
            ->andReturnTrue();

        $this->actingAs($administrator)
            ->patch(route('credentials.update', $credential), [
                'name' => $credential->name,
                'username' => $credential->username,
                'notes' => 'Rotated by the network team.',
            ])
            ->assertRedirect();

        $device->refresh();
        $this->assertTrue($device->enabled);
        $this->assertSame(DeviceApprovalStatus::Approved, $device->approval_status);
        $this->assertSame($fingerprint, $device->approval_fingerprint);
    }
}
