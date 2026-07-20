<?php

namespace Tests\Feature\NetKeep;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ScaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_internal_catalog_serves_five_thousand_enabled_devices(): void
    {
        config(['netkeep.oxidized.token' => 'scale-token']);
        $now = now();

        collect(range(1, 5000))->chunk(50)->each(function ($numbers) use ($now): void {
            DB::table('devices')->insert($numbers->map(function (int $number) use ($now): array {
                $ip = '10.'.intdiv($number, 65025).'.'.intdiv($number % 65025, 255).'.'.($number % 255 ?: 1);
                $approval = [
                    'hostname' => null,
                    'ip_address' => $ip,
                    'port' => 22,
                    'transport' => 'ssh',
                    'credential_profile_id' => null,
                    'username_override' => null,
                    'password_override_set' => false,
                    'enable_secret_override_set' => false,
                    'oxidized_model' => 'ios',
                    'custom_model_id' => null,
                ];

                return [
                    'uuid' => sprintf('00000000-0000-4000-8000-%012d', $number),
                    'name' => sprintf('router-%05d', $number),
                    'ip_address' => $ip,
                    'port' => 22,
                    'transport' => 'ssh',
                    'oxidized_model' => 'ios',
                    'backup_interval' => 3600,
                    'timeout' => 20,
                    'enabled' => true,
                    'approval_status' => 'approved',
                    'approval_fingerprint' => hash('sha256', json_encode($approval, JSON_THROW_ON_ERROR)),
                    'status' => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all());
        });

        $this->withHeader('X-NetKeep-Token', 'scale-token')
            ->getJson('/internal/oxidized/nodes')
            ->assertOk()
            ->assertJsonCount(5000)
            ->assertJsonPath('0.name', '00000000-0000-4000-8000-000000000001');
    }
}
