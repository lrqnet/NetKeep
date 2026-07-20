<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DeviceCsvLocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_export_uses_the_users_language(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Administrator,
            'locale' => 'pt_BR',
        ]);
        Device::query()->create([
            'name' => 'core-01',
            'ip_address' => '192.0.2.10',
            'oxidized_model' => 'junos',
        ]);

        $content = $this->actingAs($user)
            ->get('/devices/export')
            ->assertOk()
            ->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBFnome,hostname,endereco_ip,porta", $content);
        $this->assertStringContainsString('core-01', $content);
    }

    public function test_csv_import_accepts_headers_from_every_supported_language(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Administrator,
            'locale' => 'en',
        ]);

        $files = [
            "name,ip_address,oxidized_model\nedge-en,192.0.2.11,junos\n",
            "nome,endereco_ip,modelo_oxidized\nedge-pt,192.0.2.12,ios\n",
            "nombre,direccion_ip,modelo_oxidized\nedge-es,192.0.2.13,eos\n",
        ];

        foreach ($files as $index => $content) {
            $this->actingAs($user)->post('/devices/import', [
                'file' => UploadedFile::fake()->createWithContent("devices-{$index}.csv", $content),
            ])->assertRedirect();
        }

        $this->assertDatabaseHas('devices', ['name' => 'edge-en', 'oxidized_model' => 'junos']);
        $this->assertDatabaseHas('devices', ['name' => 'edge-pt', 'oxidized_model' => 'ios']);
        $this->assertDatabaseHas('devices', ['name' => 'edge-es', 'oxidized_model' => 'eos']);
    }

    public function test_csv_import_rejects_duplicate_localized_columns(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Administrator,
            'locale' => 'en',
        ]);
        $file = UploadedFile::fake()->createWithContent(
            'devices.csv',
            "name,nome,ip_address,oxidized_model\nedge,edge,192.0.2.14,junos\n",
        );

        $this->actingAs($user)
            ->post('/devices/import', ['file' => $file])
            ->assertUnprocessable();
    }
}
