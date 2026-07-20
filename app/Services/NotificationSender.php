<?php

namespace App\Services;

use App\Models\NotificationChannel;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;
use Symfony\Component\Mime\Email;

class NotificationSender
{
    public function __construct(
        private readonly SafeHttpClient $http,
        private readonly NetworkTargetGuard $targets,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public function send(NotificationChannel $channel, string $event, string $message, array $context = []): void
    {
        $config = $channel->config;
        $payload = ['event' => $event, 'message' => $message, 'context' => $context];
        $telegramBaseUrl = rtrim(
            (string) config('services.telegram.base_url', 'https://api.telegram.org'),
            '/',
        );

        try {
            match ($channel->type) {
                'webhook' => $this->sendWebhook($config, $payload),
                'telegram' => $this->http
                    ->pending($telegramBaseUrl, 1048576)
                    ->retry(2, 500)
                    ->post($telegramBaseUrl.'/bot'.$config['bot_token'].'/sendMessage', [
                        'chat_id' => $config['chat_id'],
                        'text' => "[NetKeep] {$message}",
                    ])->throw(),
                'smtp' => $this->sendMail($config, $event, $message),
                default => throw new \RuntimeException(__('netkeep.notifications.unknown_channel')),
            };
        } catch (\Throwable) {
            throw new \RuntimeException(__('netkeep.notifications.send_failed', ['type' => $channel->type]));
        }
    }

    /**
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $payload
     */
    private function sendWebhook(array $config, array $payload): void
    {
        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $headers = isset($config['secret']) && $config['secret'] !== ''
            ? ['X-NetKeep-Signature' => 'sha256='.hash_hmac('sha256', $body, $config['secret'])]
            : [];

        $response = $this->http
            ->pending((string) $config['url'], 1048576)
            ->retry(2, 500)
            ->withHeaders($headers)
            ->withBody($body, 'application/json')
            ->post((string) $config['url']);
        $this->http->assertResponseSize($response, 1048576)->throw();
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function sendMail(array $config, string $event, string $message): void
    {
        $host = strtolower(rtrim((string) $config['host'], '.'));
        $address = $this->targets->resolve($host)[0];
        $port = (int) ($config['port'] ?? 587);
        $encryption = (string) ($config['encryption'] ?? 'tls');
        $transport = new EsmtpTransport($address, $port, $encryption === 'ssl');
        $transport->setAutoTls($encryption === 'tls');
        $transport->setRequireTls($encryption === 'tls');
        $stream = $transport->getStream();
        if (! $stream instanceof SocketStream) {
            throw new \RuntimeException('smtp_stream_unavailable');
        }
        $stream->setStreamOptions([
            'ssl' => [
                'peer_name' => $host,
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ],
        ]);
        if (filled($config['username'] ?? null)) {
            $transport->setUsername((string) $config['username']);
        }
        if (filled($config['password'] ?? null)) {
            $transport->setPassword((string) $config['password']);
        }
        (new Mailer($transport))->send(
            (new Email)
                ->from((string) $config['from'])
                ->to((string) $config['to'])
                ->subject('[NetKeep] '.$event)
                ->text($message),
        );
    }
}
