<?php

namespace Tests\Feature\NetKeep;

use App\Services\UpdateService;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UpdateServiceTest extends TestCase
{
    protected bool $withCompletedSetup = false;

    protected function setUp(): void
    {
        parent::setUp();

        Http::swap(new Factory);
        Http::preventStrayRequests();
        config(['netkeep.updates.wud_url' => 'http://wud:3000']);
    }

    public function test_it_reads_the_wud_8_container_shape(): void
    {
        Http::fake([
            '*' => Http::response([[
                'id' => str_repeat('a', 64),
                'name' => 'netkeep-app-1',
                'image' => [
                    'name' => 'ghcr.io/lrqnet/netkeep',
                    'tag' => ['value' => '1.0.0'],
                ],
                'result' => ['tag' => '1.1.0'],
                'updateAvailable' => true,
            ]]),
        ]);

        $status = app(UpdateService::class)->status();

        Http::assertSent(
            fn (Request $request): bool => $request->method() === 'GET'
                && $request->url() === 'http://wud:3000/api/containers',
        );
        $this->assertTrue($status['online']);
        $this->assertTrue($status['available']);
        $this->assertSame('1.0.0', $status['current']);
        $this->assertSame('1.1.0', $status['candidate']);
        $this->assertSame(str_repeat('a', 64), $status['container_id']);
    }

    public function test_it_calls_the_documented_container_trigger_route(): void
    {
        Http::fake();
        $containerId = str_repeat('b', 64);

        app(UpdateService::class)->trigger($containerId);

        Http::assertSent(
            fn (Request $request): bool => $request->method() === 'POST'
                && $request->url() === "http://wud:3000/api/containers/{$containerId}/triggers/dockercompose/netkeep",
        );
    }

    public function test_it_rejects_an_untrusted_container_identifier(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        app(UpdateService::class)->trigger('../../docker.sock');
    }
}
