<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DeviceApprovalStatus;
use App\Enums\UserRole;
use App\Models\CredentialProfile;
use App\Models\Device;
use App\Models\DeviceGroup;
use App\Models\User;
use App\Services\DeviceApprovalService;
use App\Services\KnownHostsWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class OxidizedNodesTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_inventory_returns_only_the_internal_bootstrap_sentinel(): void
    {
        config(['netkeep.oxidized.token' => 'internal-test-token']);

        $this->withHeader('X-NetKeep-Token', 'internal-test-token')
            ->getJson('/internal/oxidized/nodes')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', '__netkeep_bootstrap__')
            ->assertJsonPath('0.ip', '192.0.2.1');
    }

    public function test_internal_source_requires_token_and_returns_decrypted_credentials_only_to_engine(): void
    {
        config(['netkeep.oxidized.token' => 'internal-test-token']);
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $group = DeviceGroup::query()->create(['name' => 'backbone']);
        $credentials = CredentialProfile::query()->create([
            'name' => 'core-access',
            'username' => 'netops',
            'password' => 'plain-test-secret',
            'enable_secret' => 'enable-test-secret',
            'created_by' => $owner->id,
        ]);
        $device = Device::query()->create([
            'name' => 'core-01',
            'ip_address' => '192.0.2.10',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'device_group_id' => $group->id,
            'credential_profile_id' => $credentials->id,
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approved_resolved_addresses' => ['192.0.2.10'],
        ]);
        $device->update([
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ]);

        $this->getJson('/internal/oxidized/nodes')->assertForbidden();
        $this->withHeader('X-NetKeep-Token', 'internal-test-token')
            ->getJson('/internal/oxidized/nodes')
            ->assertOk()
            ->assertJsonPath('0.name', $device->uuid)
            ->assertJsonPath('0.username', 'netops')
            ->assertJsonPath('0.password', 'plain-test-secret')
            ->assertJsonPath('0.enable', 'enable-test-secret');

        $stored = DB::table('credential_profiles')->value('password');
        $this->assertNotSame('plain-test-secret', $stored);
        $this->assertStringNotContainsString('plain-test-secret', (string) $stored);
    }

    public function test_internal_source_pins_hostname_devices_to_the_approved_address(): void
    {
        config(['netkeep.oxidized.token' => 'internal-test-token']);
        $device = Device::query()->create([
            'name' => 'hostname-device',
            'hostname' => 'router.example.test',
            'ip_address' => '198.51.100.24',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approved_resolved_addresses' => ['198.51.100.25'],
        ]);
        $device->update([
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ]);

        $this->withHeader('X-NetKeep-Token', 'internal-test-token')
            ->getJson('/internal/oxidized/nodes')
            ->assertOk()
            ->assertJsonPath('0.name', $device->uuid)
            ->assertJsonPath('0.ip', '198.51.100.25');
    }

    public function test_known_hosts_contains_hostname_and_approved_address(): void
    {
        $device = Device::query()->create([
            'name' => 'hostname-device',
            'hostname' => 'router.example.test',
            'ip_address' => '198.51.100.24',
            'port' => 2222,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approved_resolved_addresses' => ['198.51.100.25'],
            'ssh_host_key' => 'router.example.test ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFictional',
        ]);
        $directory = storage_path('framework/testing/known-hosts-'.Str::uuid());

        try {
            app(KnownHostsWriter::class)->write($directory);
            $content = File::get($directory.'/.ssh/known_hosts');

            $this->assertStringContainsString(
                '[router.example.test]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFictional',
                $content,
            );
            $this->assertStringContainsString(
                '[198.51.100.25]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFictional',
                $content,
            );
        } finally {
            File::deleteDirectory($directory);
        }
    }

    public function test_internal_source_excludes_dangerous_drivers_when_the_feature_is_disabled(): void
    {
        config(['netkeep.oxidized.token' => 'internal-test-token']);
        $device = Device::query()->create([
            'name' => 'unreviewed-driver',
            'ip_address' => '192.0.2.11',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'acmepacket',
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
            'approved_resolved_addresses' => ['192.0.2.11'],
        ]);
        $device->update([
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ]);

        $this->withHeader('X-NetKeep-Token', 'internal-test-token')
            ->getJson('/internal/oxidized/nodes')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', '__netkeep_bootstrap__');
    }
}
