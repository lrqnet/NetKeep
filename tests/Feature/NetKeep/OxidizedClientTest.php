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

    public function test_sandbox_client_restarts_the_engine_through_authenticated_controller(): void
    {
        config([
            'netkeep.oxidized.token' => 'internal-test-token',
            'netkeep.sandbox.url' => 'http://sandbox:8888',
            'netkeep.sandbox.control_url' => 'http://sandbox:8890',
        ]);
        Http::swap(new Factory);
        Http::fake(fn (Request $request) => str_ends_with($request->url(), '/restart')
            ? Http::response(status: 204)
            : Http::response([['name' => 'sandbox-device-uuid']], 200));

        $this->assertTrue(app(SandboxOxidizedClient::class)->restart());
        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'http://sandbox:8890/restart'
            && $request->method() === 'POST'
            && $request->body() === ''
            && $request->header('Host') === ['sandbox']
            && $request->header('X-NetKeep-Token') === ['internal-test-token']);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'http://sandbox:8888/nodes.json');
    }
}
