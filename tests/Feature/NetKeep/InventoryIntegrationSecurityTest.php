<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\AuditEvent;
use App\Models\InventorySource;
use App\Models\User;
use App\Services\InventorySynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Mockery;
use Tests\TestCase;

class InventoryIntegrationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_sync_keeps_external_failure_details_out_of_storage_audit_and_response(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $source = InventorySource::query()->create([
            'type' => 'netbox',
            'name' => 'NetBox Lab',
            'base_url' => 'https://netbox.example.test',
            'token' => 'test-integration-token',
            'enabled' => true,
            'sync_interval' => 900,
        ]);
        $marker = 'upstream-body-with-test-integration-token';
        $sync = Mockery::mock(InventorySynchronizer::class);
        $sync->shouldReceive('sync')->once()->with(Mockery::on(
            fn (InventorySource $candidate): bool => $candidate->is($source),
        ))->andThrow(new \RuntimeException($marker));
        $this->app->instance(InventorySynchronizer::class, $sync);

        $response = $this->actingAs($owner)
            ->from('/integrations')
            ->post(route('integrations.inventory.sync', $source));

        $response->assertRedirect('/integrations')
            ->assertSessionHas('error', __('netkeep.integrations.sync_failed'));
        $this->assertSame('inventory_sync_failed', $source->refresh()->last_error);
        $audit = AuditEvent::query()->where('action', 'integration.inventory_failed')->sole();
        $this->assertSame(['error_code' => 'inventory_sync_failed'], $audit->metadata);
        $this->assertStringNotContainsString($marker, $response->getContent());
        $this->assertStringNotContainsString('test-integration-token', $response->getContent());
    }

    public function test_integration_page_exposes_a_translated_generic_error_only(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        InventorySource::query()->create([
            'type' => 'librenms',
            'name' => 'LibreNMS Lab',
            'base_url' => 'https://librenms.example.test',
            'token' => 'test-integration-token',
            'enabled' => true,
            'sync_interval' => 900,
            'last_error' => 'upstream-body-with-test-integration-token',
        ]);

        $response = $this->actingAs($owner)->get('/integrations');

        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('inventorySources.0.last_error', __('netkeep.integrations.sync_failed'))
            ->where('inventorySources.0.has_token', true),
        );
        $this->assertStringNotContainsString('test-integration-token', $response->getContent());
        $this->assertStringNotContainsString('upstream-body-with-test-integration-token', $response->getContent());
    }
}
