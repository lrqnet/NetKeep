<?php

namespace Tests\Feature\NetKeep;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Models\Device;
use App\Models\InventorySource;
use App\Services\InventorySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InventorySynchronizerTest extends TestCase
{
    use RefreshDatabase;

    public function test_netbox_pagination_is_idempotent_and_preserves_netkeep_fields(): void
    {
        $source = InventorySource::query()->create([
            'type' => 'netbox',
            'name' => 'NetBox NOC',
            'base_url' => 'http://10.0.0.1',
            'token' => 'netbox-secret',
            'settings' => ['grace_period' => 300],
            'sync_interval' => 900,
            'enabled' => true,
        ]);
        Http::swap(new Factory);
        Http::fake(function (Request $request) {
            if (str_contains($request->url(), 'offset=200')) {
                return Http::response([
                    'results' => [$this->netBoxDevice(11, 'edge-02', '10.10.10.2')],
                    'next' => null,
                ]);
            }

            return Http::response([
                'results' => [$this->netBoxDevice(10, 'edge-01', '10.10.10.1')],
                'next' => 'http://10.0.0.1/api/dcim/devices/?limit=200&offset=200',
            ]);
        });

        $result = app(InventorySynchronizer::class)->sync($source);
        $this->assertSame(['created' => 2, 'updated' => 0, 'disabled' => 0], $result);
        $edge = Device::query()->where('external_id', '10')->firstOrFail();
        $edge->update(['oxidized_model' => 'junos', 'backup_interval' => 7200]);

        $second = app(InventorySynchronizer::class)->sync($source->refresh());
        $this->assertSame(['created' => 0, 'updated' => 2, 'disabled' => 0], $second);
        $this->assertSame('junos', $edge->refresh()->oxidized_model);
        $this->assertSame(7200, $edge->backup_interval);
        $this->assertDatabaseCount('devices', 2);
    }

    public function test_external_absence_disables_after_grace_and_never_deletes(): void
    {
        $source = InventorySource::query()->create([
            'type' => 'netbox',
            'name' => 'NetBox',
            'base_url' => 'http://10.0.0.2',
            'token' => 'secret',
            'settings' => ['grace_period' => 300],
            'sync_interval' => 900,
            'enabled' => true,
        ]);
        Http::swap(new Factory);
        Http::fake([
            '*' => Http::response([
                'results' => [$this->netBoxDevice(15, 'access-01', '10.20.0.1')],
                'next' => null,
            ]),
        ]);
        app(InventorySynchronizer::class)->sync($source);
        $device = Device::query()->firstOrFail();
        $device->update([
            'enabled' => true,
            'approval_status' => DeviceApprovalStatus::Approved,
        ]);

        Http::swap(new Factory);
        Http::fake(['*' => Http::response(['results' => [], 'next' => null])]);
        app(InventorySynchronizer::class)->sync($source->refresh());
        $device = Device::query()->firstOrFail();
        $this->assertTrue($device->enabled);
        $device->update(['external_missing_since' => now()->subMinutes(10)]);

        $result = app(InventorySynchronizer::class)->sync($source->refresh());
        $this->assertSame(1, $result['disabled']);
        $this->assertFalse($device->refresh()->enabled);
        $this->assertSame(DeviceStatus::Disabled, $device->status);
        $this->assertDatabaseCount('devices', 1);
    }

    public function test_duplicate_ip_is_imported_disabled_for_manual_resolution(): void
    {
        Device::query()->create([
            'name' => 'manual-core',
            'ip_address' => '10.30.0.1',
            'oxidized_model' => 'ios',
        ]);
        $source = InventorySource::query()->create([
            'type' => 'netbox',
            'name' => 'NetBox',
            'base_url' => 'http://10.0.0.3',
            'token' => 'secret',
            'sync_interval' => 900,
            'enabled' => true,
        ]);
        Http::swap(new Factory);
        Http::fake(['*' => Http::response([
            'results' => [$this->netBoxDevice(20, 'duplicate-core', '10.30.0.1')],
            'next' => null,
        ])]);

        app(InventorySynchronizer::class)->sync($source);

        $duplicate = Device::query()->where('external_id', '20')->firstOrFail();
        $this->assertFalse($duplicate->enabled);
        $this->assertSame(DeviceStatus::Conflict, $duplicate->status);
        $this->assertNotNull($duplicate->conflict_reason);
    }

    /**
     * @return array<string, mixed>
     */
    private function netBoxDevice(int $id, string $name, string $ip): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'primary_ip4' => ['address' => $ip.'/24'],
            'site' => ['name' => 'POP Central'],
            'device_type' => [
                'model' => 'Router X',
                'manufacturer' => ['name' => 'Vendor'],
            ],
            'status' => ['value' => 'active'],
            'tags' => [['name' => 'managed']],
        ];
    }
}
