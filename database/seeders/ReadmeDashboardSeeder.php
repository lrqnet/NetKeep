<?php

namespace Database\Seeders;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Enums\UserRole;
use App\Models\BackupRun;
use App\Models\Device;
use App\Models\DeviceGroup;
use App\Models\Organization;
use App\Models\Site;
use App\Models\User;
use App\Services\DeviceApprovalService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ReadmeDashboardSeeder extends Seeder
{
    public function run(): void
    {
        $password = (string) config('netkeep.readme_preview.password');

        if ($password === '') {
            throw new RuntimeException('NETKEEP_README_DEMO_PASSWORD is required.');
        }

        $owner = User::query()->updateOrCreate(
            ['email' => 'dashboard@example.test'],
            [
                'name' => 'Documentation Owner',
                'password' => Hash::make($password),
                'role' => UserRole::Owner,
                'locale' => 'en',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        Organization::query()->updateOrCreate(
            ['slug' => 'example-network-operations'],
            [
                'name' => 'Example Network Operations',
                'locale' => 'en',
                'timezone' => 'UTC',
                'settings' => [
                    'default_backup_interval' => 3600,
                    'default_timeout' => 20,
                    'full_backup_retention_days' => 30,
                ],
                'setup_completed_at' => now(),
            ],
        );

        $core = DeviceGroup::query()->updateOrCreate(
            ['name' => 'core'],
            ['description' => 'Example core network devices'],
        );
        $edge = DeviceGroup::query()->updateOrCreate(
            ['name' => 'edge'],
            ['description' => 'Example edge network devices'],
        );
        $primary = Site::query()->updateOrCreate(
            ['name' => 'Example Datacenter One'],
            ['location' => 'Example City'],
        );
        $secondary = Site::query()->updateOrCreate(
            ['name' => 'Example Branch West'],
            ['location' => 'Example Region'],
        );

        $this->seedDevice($owner, $primary, $core, 'Example-Core-01', '192.0.2.10', 'ios', DeviceStatus::Healthy, 12);
        $this->seedDevice($owner, $primary, $core, 'Example-Core-02', '192.0.2.11', 'junos', DeviceStatus::Healthy, 18);
        $this->seedDevice($owner, $secondary, $edge, 'Example-Edge-01', '192.0.2.12', 'routeros', DeviceStatus::Healthy, 24);
        $this->seedDevice($owner, $secondary, $edge, 'Example-Edge-02', '192.0.2.13', 'routeros', DeviceStatus::Healthy, 31);
        $this->seedDevice($owner, $primary, $core, 'Example-Firewall-01', '192.0.2.14', 'fortios', DeviceStatus::Healthy, 42);
        $this->seedDevice($owner, $secondary, $edge, 'Example-Access-01', '192.0.2.15', 'iosxe', DeviceStatus::Healthy, 55);
        $this->seedDevice($owner, $secondary, $edge, 'Example-Edge-03', '192.0.2.16', 'routeros', DeviceStatus::Failing, 125);
        $this->seedDevice($owner, $primary, $edge, 'Example-Access-02', '192.0.2.17', 'ios', DeviceStatus::Pending, 30);

        Device::query()
            ->whereIn('name', [
                'Example-Core-01',
                'Example-Core-02',
                'Example-Edge-01',
                'Example-Firewall-01',
                'Example-Access-01',
            ])
            ->get()
            ->each(function (Device $device): void {
                BackupRun::query()->updateOrCreate(
                    [
                        'device_id' => $device->id,
                        'git_commit' => str_pad((string) $device->id, 40, '0', STR_PAD_LEFT),
                    ],
                    [
                        'status' => 'success',
                        'started_at' => now()->subMinutes(20),
                        'finished_at' => now()->subMinutes(10),
                        'changed' => true,
                    ],
                );
            });
    }

    private function seedDevice(
        User $owner,
        Site $site,
        DeviceGroup $group,
        string $name,
        string $address,
        string $model,
        DeviceStatus $status,
        int $minutesAgo,
    ): void {
        $device = Device::query()->updateOrCreate(
            ['name' => $name],
            [
                'ip_address' => $address,
                'port' => 22,
                'transport' => 'ssh',
                'oxidized_model' => $model,
                'site_id' => $site->id,
                'device_group_id' => $group->id,
                'backup_interval' => 3600,
                'timeout' => 20,
                'enabled' => true,
                'status' => $status,
                'approval_status' => DeviceApprovalStatus::Approved,
                'approved_by' => $owner->id,
                'approved_at' => now()->subDays(7),
                'approved_resolved_addresses' => [$address],
                'ssh_host_key' => 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDocumentationOnlyKey',
                'ssh_host_key_fingerprint' => 'SHA256:documentation-only-key',
                'last_backup_at' => now()->subMinutes($minutesAgo),
                'last_success_at' => $status === DeviceStatus::Healthy
                    ? now()->subMinutes($minutesAgo)
                    : null,
                'next_collection_at' => now()->addDay(),
                'consecutive_failures' => $status === DeviceStatus::Failing ? 1 : 0,
            ],
        );

        $device->update([
            'approval_fingerprint' => app(DeviceApprovalService::class)->fingerprint($device),
        ]);
    }
}
