<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

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

    public function restart(): bool
    {
        try {
            $response = Http::baseUrl(rtrim((string) config('netkeep.sandbox.control_url'), '/'))
                ->withHeaders([
                    'Host' => 'sandbox',
                    'X-NetKeep-Token' => (string) config('netkeep.oxidized.token'),
                ])
                ->timeout(15)
                ->send('POST', '/restart', ['body' => '']);
            if (! $response->successful()) {
                return false;
            }
        } catch (Throwable) {
            return false;
        }

        $deadline = microtime(true) + 30;
        do {
            usleep(250_000);
            try {
                $available = $this->client()->get('/nodes.json')->successful();
            } catch (Throwable) {
                $available = false;
            }
            if ($available) {
                return true;
            }
        } while (microtime(true) < $deadline);

        return false;
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
