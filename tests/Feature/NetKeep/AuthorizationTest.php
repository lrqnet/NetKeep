<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function devicePayload(): array
    {
        return [
            'name' => 'edge-01',
            'ip_address' => '198.51.100.2',
            'port' => 22,
            'transport' => 'ssh',
            'oxidized_model' => 'junos',
            'backup_interval' => 3600,
            'timeout' => 20,
            'enabled' => true,
        ];
    }

    public function test_viewer_cannot_change_inventory(): void
    {
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);

        $this->actingAs($viewer)
            ->post('/devices', $this->devicePayload())
            ->assertForbidden();
    }

    public function test_operator_can_add_device_but_cannot_manage_credentials(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);

        $this->actingAs($operator)
            ->post('/devices', $this->devicePayload())
            ->assertRedirect();
        $this->assertDatabaseHas('devices', ['name' => 'edge-01']);
        $this->actingAs($operator)->get('/credentials')->assertForbidden();
    }

    public function test_optional_empty_tag_does_not_block_device_creation(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);

        $this->actingAs($operator)
            ->post('/devices', $this->devicePayload() + ['tags' => [null]])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('devices', ['name' => 'edge-01']);
    }
}
