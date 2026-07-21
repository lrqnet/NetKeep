<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\ResponseInterface;

class SafeHttpClient
{
    public function __construct(private readonly OutboundUrlGuard $urls) {}

    public function pending(string $url, int $maxResponseBytes = 10485760): PendingRequest
    {
        return Http::withOptions($this->options($url, $maxResponseBytes))
            ->connectTimeout(5)
            ->timeout(20)
            ->withoutRedirecting();
    }

    public function baseUrl(string $url, int $maxResponseBytes = 10485760): PendingRequest
    {
        return $this->pending($url, $maxResponseBytes)->baseUrl(rtrim($url, '/'));
    }

    /** @return array<string, mixed> */
    public function options(string $url, int $maxResponseBytes = 10485760): array
    {
        $resolved = $this->urls->resolveUrl($url);
        $addresses = implode(',', array_map(
            fn (string $address): string => str_contains($address, ':') ? "[{$address}]" : $address,
            $resolved['addresses'],
        ));
        $options = [
            'allow_redirects' => false,
            'on_headers' => function (ResponseInterface $response) use ($maxResponseBytes): void {
                $length = $response->getHeaderLine('Content-Length');
                if ($length !== '' && ctype_digit($length) && (int) $length > $maxResponseBytes) {
                    throw new \RuntimeException('outbound_response_too_large');
                }
            },
        ];
        if (defined('CURLOPT_RESOLVE')) {
            $options['curl'] = [
                CURLOPT_RESOLVE => [
                    "{$resolved['host']}:{$resolved['port']}:{$addresses}",
                ],
            ];
        }

        return $options;
    }

    public function assertResponseSize(Response $response, int $maxResponseBytes = 10485760): Response
    {
        if (strlen($response->body()) > $maxResponseBytes) {
            throw new \RuntimeException('outbound_response_too_large');
        }

        return $response;
    }
}
