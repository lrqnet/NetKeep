<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Services\OxidizedEngineConfigService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_update_operational_defaults_after_password_confirmation(): void
    {
        $administrator = User::factory()->create(['role' => UserRole::Administrator]);
        $this->mock(OxidizedEngineConfigService::class)
            ->shouldReceive('configure')
            ->once()
            ->with(5);

        $this->actingAs($administrator)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->put('/system', [
                'name' => 'ISP Livre',
                'locale' => 'es',
                'timezone' => 'America/Bogota',
                'domain' => 'netkeep.example.com',
                'remove_logo' => false,
                'default_backup_interval' => 1800,
                'default_timeout' => 30,
                'full_backup_retention_days' => 90,
                'collection_concurrency' => 5,
            ])
            ->assertRedirect();

        $organization = Organization::query()->firstOrFail();
        $this->assertSame('ISP Livre', $organization->name);
        $this->assertSame(1800, $organization->settings['default_backup_interval']);
        $this->assertSame(90, $organization->settings['full_backup_retention_days']);
        $this->assertDatabaseHas('audit_events', ['action' => 'system.settings_updated']);
    }

    public function test_operator_cannot_open_system_settings(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);

        $this->actingAs($operator)->get('/system')->assertForbidden();
    }
}
