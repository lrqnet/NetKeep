<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class UpdateService
{
    /**
     * @return array{online:bool,available:bool,current:?string,candidate:?string,container_id:?string,error?:string}
     */
    public function status(): array
    {
        try {
            $response = Http::baseUrl((string) config('netkeep.updates.wud_url'))
                ->acceptJson()
                ->timeout(5)
                ->get('/api/containers');
            $response->throw();
            $payload = $response->json();
            $containers = collect(is_array($payload) ? $payload : []);
            $container = $containers->first(function (mixed $candidate): bool {
                if (! is_array($candidate)) {
                    return false;
                }

                return str_contains((string) data_get($candidate, 'image.name'), 'lrqnet/netkeep')
                    || str_contains((string) ($candidate['name'] ?? ''), 'netkeep-app');
            });

            if (! is_array($container)) {
                return ['online' => true, 'available' => false, 'current' => null, 'candidate' => null, 'container_id' => null];
            }
            $current = data_get($container, 'image.tag.value');
            $candidate = data_get($container, 'result.tag');

            return [
                'online' => true,
                'available' => (bool) ($container['updateAvailable'] ?? false),
                'current' => is_string($current) ? $current : null,
                'candidate' => is_string($candidate) ? $candidate : null,
                'container_id' => isset($container['id']) ? (string) $container['id'] : null,
            ];
        } catch (\Throwable $exception) {
            return [
                'online' => false,
                'available' => false,
                'current' => (string) config('netkeep.version'),
                'candidate' => null,
                'container_id' => null,
                'error' => $exception->getMessage(),
            ];
        }
    }

    public function trigger(string $containerId): void
    {
        if (! preg_match('/^[a-f0-9]{12,64}$/', $containerId)) {
            throw new \InvalidArgumentException('Identificador do contêiner inválido.');
        }

        Http::baseUrl((string) config('netkeep.updates.wud_url'))
            ->acceptJson()
            ->timeout(30)
            ->post("/api/containers/{$containerId}/triggers/dockercompose/netkeep")
            ->throw();
    }
}
