<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class SandboxOxidizedClient
{
    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('netkeep.sandbox.url'), '/'))
            ->acceptJson()
            ->timeout((int) config('netkeep.sandbox.timeout', 10));
    }

    public function reload(): bool
    {
        return $this->client()->get('/reload')->successful();
    }

    public function collect(string $node): bool
    {
        return $this->client()->get('/node/next/'.rawurlencode($node))->successful();
    }

    /** @return list<mixed> */
    public function nodes(): array
    {
        $response = $this->client()->get('/nodes.json');

        return $response->successful() && is_array($response->json())
            ? array_values((array) $response->json())
            : [];
    }
}
