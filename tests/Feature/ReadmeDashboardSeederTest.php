<?php

namespace Tests\Feature;

use App\Enums\DeviceApprovalStatus;
use App\Models\BackupRun;
use App\Models\Device;
use App\Models\User;
use Database\Seeders\ReadmeDashboardSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class ReadmeDashboardSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_requires_an_explicit_demo_password(): void
    {
        config()->set('netkeep.readme_preview.password', null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('NETKEEP_README_DEMO_PASSWORD is required.');

        $this->seed(ReadmeDashboardSeeder::class);
    }

    public function test_it_seeds_only_fictional_dashboard_data(): void
    {
        config()->set('netkeep.readme_preview.password', 'documentation-demo-password');

        $this->seed(ReadmeDashboardSeeder::class);

        $this->assertDatabaseCount('devices', 8);
        $this->assertDatabaseCount('backup_runs', 5);
        $this->assertDatabaseHas('organizations', [
            'slug' => 'example-network-operations',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'dashboard@example.test',
        ]);
        $this->assertSame(0, Device::query()
            ->whereNot('ip_address', 'like', '192.0.2.%')
            ->count());
        $this->assertSame(8, Device::query()
            ->where('approval_status', DeviceApprovalStatus::Approved)
            ->where('enabled', true)
            ->count());
        $this->assertSame(1, User::query()
            ->where('email', 'dashboard@example.test')
            ->count());
        $this->assertSame(5, BackupRun::query()->count());
    }
}
