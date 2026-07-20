<?php

namespace Tests\Feature\NetKeep;

use App\Models\NotificationChannel;
use App\Services\NotificationSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationSenderTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_signature_covers_the_exact_request_body(): void
    {
        $channel = NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'NOC',
            'enabled' => true,
            'events' => ['change'],
            'config' => ['url' => 'https://10.0.0.5/hook', 'secret' => 'hmac-secret'],
        ]);
        Http::swap(new Factory);
        Http::fake(['*' => Http::response([], 204)]);

        app(NotificationSender::class)->send($channel, 'change', 'Configuração alterada', ['device_id' => 10]);

        Http::assertSent(function (Request $request): bool {
            $expected = 'sha256='.hash_hmac('sha256', $request->body(), 'hmac-secret');

            return $request->header('X-NetKeep-Signature')[0] === $expected;
        });
    }

    public function test_transport_errors_never_expose_telegram_token(): void
    {
        $token = '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
        $channel = NotificationChannel::query()->create([
            'type' => 'telegram',
            'name' => 'Telegram',
            'enabled' => true,
            'events' => ['failure'],
            'config' => ['bot_token' => $token, 'chat_id' => '123'],
        ]);
        Http::swap(new Factory);
        Http::fake(fn (Request $request) => throw new ConnectionException('Falha em '.$request->url()));

        try {
            app(NotificationSender::class)->send($channel, 'failure', 'Falha');
            $this->fail('Uma exceção sanitizada era esperada.');
        } catch (\RuntimeException $exception) {
            $this->assertStringNotContainsString($token, $exception->getMessage());
            $this->assertSame('Não foi possível enviar o canal de alerta telegram.', $exception->getMessage());
        }
    }
}
