<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\UserRole;
use App\Models\AuditEvent;
use App\Models\Device;
use App\Models\User;
use App\Services\KnownHostsWriter;
use App\Services\NetworkTargetGuard;
use App\Services\OxidizedClient;
use App\Services\SshHostKeyScanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Lang;
use RuntimeException;
use Tests\TestCase;

class DeviceApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_unavailable_ssh_host_key_returns_a_safe_error_and_preserves_pending_state(): void
    {
        $owner = User::factory()->create([
            'role' => UserRole::Owner,
            'locale' => 'en',
        ]);
        $device = $this->pendingDevice();
        $safeMessage = Lang::get('netkeep.devices.ssh_host_key_unavailable', locale: 'en');

        $this->mock(NetworkTargetGuard::class)
            ->shouldReceive('resolve')
            ->once()
            ->with('198.51.100.20')
            ->andReturn(['198.51.100.20']);
        $this->mock(SshHostKeyScanner::class)
            ->shouldReceive('scan')
            ->once()
            ->with('198.51.100.20', 22)
            ->andThrow(new RuntimeException('ssh_host_key_unavailable'));
        $this->mock(KnownHostsWriter::class)
            ->shouldNotReceive('write');
        $this->mock(OxidizedClient::class)
            ->shouldNotReceive('reload');

        $response = $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.approve', $device));

        $response
            ->assertRedirect()
            ->assertSessionHas('error', $safeMessage);
        $this->assertStringNotContainsString('ssh_host_key_unavailable', $safeMessage);
        $this->assertStringNotContainsString('198.51.100.20', $safeMessage);

        $device->refresh();
        $this->assertFalse($device->enabled);
        $this->assertSame(DeviceStatus::Pending, $device->status);
        $this->assertSame(DeviceApprovalStatus::Pending, $device->approval_status);
        $this->assertNull($device->approval_fingerprint);
        $this->assertNull($device->approved_by);
        $this->assertNull($device->approved_at);
        $this->assertNull($device->ssh_host_key);
        $this->assertNull($device->ssh_host_key_fingerprint);

        $audit = AuditEvent::query()
            ->where('action', 'device.approval_failed')
            ->where('subject_id', $device->id)
            ->firstOrFail();
        $this->assertSame([
            'reason' => 'ssh_host_key_unavailable',
            'transport' => 'ssh',
            'port' => 22,
        ], $audit->metadata);
        $this->assertStringNotContainsString('198.51.100.20', json_encode($audit->metadata, JSON_THROW_ON_ERROR));
        $this->assertDatabaseMissing('audit_events', [
            'action' => 'device.approved',
            'subject_id' => $device->id,
        ]);
    }

    public function test_valid_ssh_host_key_still_approves_the_device(): void
    {
        $owner = User::factory()->create([
            'role' => UserRole::Owner,
            'locale' => 'en',
        ]);
        $device = $this->pendingDevice();
        $hostKey = '198.51.100.20 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFictional';
        $fingerprint = 'SHA256:fictional';

        $this->mock(NetworkTargetGuard::class)
            ->shouldReceive('resolve')
            ->once()
            ->with('198.51.100.20')
            ->andReturn(['198.51.100.20']);
        $this->mock(SshHostKeyScanner::class)
            ->shouldReceive('scan')
            ->once()
            ->with('198.51.100.20', 22)
            ->andReturn([
                'keys' => $hostKey,
                'fingerprint' => $fingerprint,
            ]);
        $this->mock(KnownHostsWriter::class)
            ->shouldReceive('write')
            ->once();
        $this->mock(OxidizedClient::class)
            ->shouldReceive('reload')
            ->once()
            ->andReturnTrue();

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('devices.approve', $device))
            ->assertRedirect()
            ->assertSessionHas('success', Lang::get('netkeep.devices.approved', locale: 'en'));

        $device->refresh();
        $this->assertTrue($device->enabled);
        $this->assertSame(DeviceStatus::Pending, $device->status);
        $this->assertSame(DeviceApprovalStatus::Approved, $device->approval_status);
        $this->assertSame($owner->id, $device->approved_by);
        $this->assertNotNull($device->approved_at);
        $this->assertSame(['198.51.100.20'], $device->approved_resolved_addresses);
        $this->assertSame($hostKey, $device->ssh_host_key);
        $this->assertSame($fingerprint, $device->ssh_host_key_fingerprint);

        $this->assertDatabaseHas('audit_events', [
            'action' => 'device.approved',
            'subject_id' => $device->id,
        ]);
        $this->assertDatabaseMissing('audit_events', [
            'action' => 'device.approval_failed',
            'subject_id' => $device->id,
        ]);
    }

    public function test_ssh_host_key_error_has_complete_backend_translations(): void
    {
        $messages = [
            'en' => 'The SSH host key could not be obtained. Check that NetKeep can reach the device and that SSH is listening on the configured port.',
            'pt_BR' => 'Não foi possível obter a chave do host SSH. Verifique se o NetKeep alcança o equipamento e se o SSH está ativo na porta configurada.',
            'es' => 'No se pudo obtener la clave del host SSH. Verifica que NetKeep pueda alcanzar el equipo y que SSH esté activo en el puerto configurado.',
        ];

        foreach ($messages as $locale => $message) {
            $this->assertSame(
                $message,
                Lang::get('netkeep.devices.ssh_host_key_unavailable', locale: $locale),
            );
        }
    }

    private function pendingDevice(): Device
    {
        return Device::query()->create([
            'name' => 'edge-approval-test',
            'ip_address' => '198.51.100.20',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'ios',
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => DeviceApprovalStatus::Pending,
        ]);
    }
}
