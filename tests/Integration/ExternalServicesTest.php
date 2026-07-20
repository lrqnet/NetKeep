<?php

namespace Tests\Integration;

use App\Models\NotificationChannel;
use App\Services\NotificationSender;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExternalServicesTest extends TestCase
{
    private string $wiremock;

    protected function setUp(): void
    {
        if (! filter_var(getenv('NETKEEP_INTEGRATION_TESTS'), FILTER_VALIDATE_BOOL)) {
            $this->markTestSkipped('External service integration tests are disabled.');
        }

        parent::setUp();

        Http::swap(new Factory);
        $this->wiremock = 'http://wiremock:8080';
    }

    public function test_webhook_retries_and_preserves_the_signed_payload(): void
    {
        Http::delete($this->wiremock.'/__admin/mappings')->throw();
        Http::delete($this->wiremock.'/__admin/requests')->throw();
        Http::post($this->wiremock.'/__admin/mappings', [
            'scenarioName' => 'webhook-retry',
            'requiredScenarioState' => 'Started',
            'newScenarioState' => 'recovered',
            'request' => ['method' => 'POST', 'urlPath' => '/netkeep-hook'],
            'response' => ['status' => 500],
        ])->throw();
        Http::post($this->wiremock.'/__admin/mappings', [
            'scenarioName' => 'webhook-retry',
            'requiredScenarioState' => 'recovered',
            'request' => ['method' => 'POST', 'urlPath' => '/netkeep-hook'],
            'response' => ['status' => 204],
        ])->throw();

        $payload = [
            'event' => 'change',
            'message' => 'Configuration changed',
            'context' => ['device_id' => 42],
        ];
        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = 'sha256='.hash_hmac('sha256', $body, 'integration-hmac');
        $channel = NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'WireMock',
            'enabled' => true,
            'events' => ['change'],
            'config' => [
                'url' => $this->wiremock.'/netkeep-hook',
                'secret' => 'integration-hmac',
            ],
        ]);

        app(NotificationSender::class)->send(
            $channel,
            $payload['event'],
            $payload['message'],
            $payload['context'],
        );

        $count = Http::post($this->wiremock.'/__admin/requests/count', [
            'method' => 'POST',
            'urlPath' => '/netkeep-hook',
            'headers' => [
                'X-NetKeep-Signature' => ['equalTo' => $signature],
            ],
            'bodyPatterns' => [['equalToJson' => $body]],
        ])->throw()->json('count');

        $this->assertSame(2, $count);
    }

    public function test_telegram_uses_the_isolated_endpoint(): void
    {
        Http::delete($this->wiremock.'/__admin/mappings')->throw();
        Http::delete($this->wiremock.'/__admin/requests')->throw();
        Http::post($this->wiremock.'/__admin/mappings', [
            'request' => [
                'method' => 'POST',
                'urlPath' => '/bot123456:integration-token/sendMessage',
            ],
            'response' => [
                'status' => 200,
                'jsonBody' => ['ok' => true],
                'headers' => ['Content-Type' => 'application/json'],
            ],
        ])->throw();

        $channel = NotificationChannel::query()->create([
            'type' => 'telegram',
            'name' => 'WireMock Telegram',
            'enabled' => true,
            'events' => ['failure'],
            'config' => [
                'bot_token' => '123456:integration-token',
                'chat_id' => '-100123456',
            ],
        ]);

        app(NotificationSender::class)->send($channel, 'failure', 'Device unavailable');

        $count = Http::post($this->wiremock.'/__admin/requests/count', [
            'method' => 'POST',
            'urlPath' => '/bot123456:integration-token/sendMessage',
            'bodyPatterns' => [
                ['matchesJsonPath' => '$[?(@.chat_id == \'-100123456\')]'],
                ['matchesJsonPath' => '$[?(@.text == \'[NetKeep] Device unavailable\')]'],
            ],
        ])->throw()->json('count');

        $this->assertSame(1, $count);
    }

    public function test_smtp_delivers_a_message_to_mailpit(): void
    {
        $recipient = 'e2e-recipient@netkeep.invalid';
        $channel = NotificationChannel::query()->create([
            'type' => 'smtp',
            'name' => 'Mailpit',
            'enabled' => true,
            'events' => ['recovery'],
            'config' => [
                'host' => 'mailpit',
                'port' => 1025,
                'encryption' => 'none',
                'username' => '',
                'password' => '',
                'from' => 'netkeep@netkeep.invalid',
                'to' => $recipient,
            ],
        ]);

        app(NotificationSender::class)->send($channel, 'recovery', 'Device recovered');

        $messages = Http::get('http://mailpit:8025/api/v1/messages')
            ->throw()
            ->json('messages');
        $message = collect($messages)->first(
            fn (array $item): bool => collect($item['To'] ?? [])
                ->contains(fn (array $to): bool => ($to['Address'] ?? null) === $recipient),
        );

        $this->assertIsArray($message);
        $this->assertSame('[NetKeep] recovery', $message['Subject']);
        $this->assertStringContainsString(
            'Device recovered',
            Http::get('http://mailpit:8025/view/'.$message['ID'].'.txt')->throw()->body(),
        );
    }
}
