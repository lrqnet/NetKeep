<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\BackupArchive;
use App\Models\BackupDestination;
use App\Models\InventorySource;
use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AdministrativePageSeparationTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_page_exposes_only_its_own_domain_data(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        InventorySource::query()->create([
            'type' => 'netbox',
            'name' => 'NetBox',
            'base_url' => 'https://netbox.example.com',
            'token' => 'example-inventory-token',
            'enabled' => true,
            'sync_interval' => 900,
            'settings' => [],
        ]);
        NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'NOC',
            'enabled' => false,
            'events' => ['failure'],
            'config' => [
                'url' => 'https://hooks.example.com/netkeep',
                'secret' => 'example-webhook-secret',
            ],
        ]);
        $destination = BackupDestination::query()->create([
            'type' => 's3',
            'name' => 'External vault',
            'enabled' => true,
            'config' => [
                'bucket' => 'netkeep-example',
                'key' => 'example-access-key',
                'secret' => 'example-secret-key',
            ],
        ]);
        BackupArchive::query()->create([
            'backup_destination_id' => $destination->id,
            'status' => 'failed',
            'encryption_mode' => 'password',
            'started_at' => now(),
            'error' => 'Sensitive internal failure',
        ]);
        BackupDestination::query()->create([
            'type' => 'git',
            'name' => 'Private mirror',
            'enabled' => false,
            'config' => [
                'url' => 'https://git.example.com/private/netkeep.git',
                'auth_type' => 'token',
                'token' => 'example-private-token',
            ],
            'last_run_status' => 'failed',
            'last_run_at' => now(),
        ]);

        $this->actingAs($owner)
            ->get('/integrations')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('integrations/index')
                ->has('inventorySources', 1)
                ->missing('channels')
                ->missing('destinations'));

        $this->actingAs($owner)
            ->get('/notifications')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notifications/index')
                ->has('channels', 1)
                ->where('summary.active', 0)
                ->where('summary.paused', 1)
                ->where('summary.failed', 0)
                ->missing('inventorySources')
                ->missing('destinations')
                ->missing('channels.0.config'));

        $this->actingAs($owner)
            ->get('/data-protection')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('data-protection/index')
                ->has('destinations', 2)
                ->where('summary.active', 1)
                ->where('summary.paused', 1)
                ->where('summary.failed', 2)
                ->where('destinations.0.last_run.status', 'failed')
                ->where('destinations.1.last_run.status', 'failed')
                ->missing('inventorySources')
                ->missing('channels')
                ->missing('destinations.0.config')
                ->missing('destinations.0.last_run.error')
                ->missing('destinations.1.config')
                ->missing('destinations.1.last_run.error'));
    }

    public function test_only_owner_and_administrator_can_access_the_three_pages(): void
    {
        $routes = ['/integrations', '/notifications', '/data-protection'];

        foreach ([UserRole::Owner, UserRole::Administrator] as $role) {
            $user = User::factory()->create(['role' => $role]);
            foreach ($routes as $route) {
                $this->actingAs($user)->get($route)->assertOk();
            }
        }

        foreach ([UserRole::Operator, UserRole::Viewer] as $role) {
            $user = User::factory()->create(['role' => $role]);
            foreach ($routes as $route) {
                $this->actingAs($user)->get($route)->assertForbidden();
            }
        }
    }
}
