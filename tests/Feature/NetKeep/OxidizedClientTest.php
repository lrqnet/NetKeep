<?php

namespace Tests\Feature\NetKeep;

use App\Services\OxidizedClient;
use App\Services\SandboxOxidizedClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OxidizedClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_clients_read_the_json_nodes_endpoint(): void
    {
        config([
            'netkeep.oxidized.url' => 'http://oxidized:8888',
            'netkeep.sandbox.url' => 'http://sandbox:8888',
        ]);
        Http::swap(new Factory);
        Http::fake(function (Request $request) {
            $body = str_contains($request->url(), 'sandbox')
                ? [['name' => 'sandbox-device-uuid']]
                : [
                    ['name' => '__netkeep_bootstrap__'],
                    ['name' => 'device-uuid'],
                ];

            return Http::response($body, 200, ['Content-Type' => 'application/json']);
        });

        $this->assertSame(
            [['name' => 'device-uuid']],
            app(OxidizedClient::class)->nodes(),
        );
        $this->assertSame(
            [['name' => 'sandbox-device-uuid']],
            app(SandboxOxidizedClient::class)->nodes(),
        );
        Http::assertSentCount(2);
        Http::assertSent(
            fn (Request $request): bool => $request->url() === 'http://oxidized:8888/nodes.json',
        );
        Http::assertSent(
            fn (Request $request): bool => $request->url() === 'http://sandbox:8888/nodes.json',
        );
    }
}
