<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class OxidizedClient
{
    private function client(bool $retry = true): PendingRequest
    {
        $client = Http::baseUrl(rtrim((string) config('netkeep.oxidized.url'), '/'))
            ->acceptJson()
            ->timeout((int) config('netkeep.oxidized.timeout', 10));

        return $retry ? $client->retry(2, 250, throw: false) : $client;
    }

    /**
     * @return array<string, mixed>
     */
    public function health(): array
    {
        try {
            $response = $this->client()->get('/nodes.json');
            $nodes = $response->successful() && is_array($response->json())
                ? $this->withoutBootstrapNode((array) $response->json())
                : [];

            return [
                'ok' => $response->successful(),
                'status' => $response->status(),
                'nodes' => count($nodes),
            ];
        } catch (\Throwable $exception) {
            return ['ok' => false, 'status' => 0, 'error' => $exception->getMessage()];
        }
    }

    public function reload(): bool
    {
        return $this->client()->get('/reload')->successful();
    }

    public function collect(string $node): bool
    {
        return $this->client(false)->get('/node/next/'.rawurlencode($node))->successful();
    }

    /**
     * @return array<int, mixed>
     */
    public function nodes(): array
    {
        $response = $this->client()->get('/nodes.json');

        return $response->successful()
            ? $this->withoutBootstrapNode((array) $response->json())
            : [];
    }

    /**
     * @param  array<int, mixed>  $nodes
     * @return array<int, mixed>
     */
    private function withoutBootstrapNode(array $nodes): array
    {
        return array_values(array_filter(
            $nodes,
            static fn (mixed $node): bool => ! is_array($node)
                || ($node['name'] ?? null) !== '__netkeep_bootstrap__',
        ));
    }
}
