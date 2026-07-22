<?php

namespace App\Services;

use App\Models\UpdateOperation;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class UpdateExchangeService
{
    public function prepare(UpdateOperation $operation): void
    {
        $assets = $operation->metadata['assets'] ?? null;
        if (! is_array($assets)) {
            throw new RuntimeException('update_assets_missing');
        }
        $required = [
            'compose.yaml' => 1048576,
            'update-manifest.json' => 1048576,
            'update-manifest.sigstore.json' => 4194304,
        ];
        $root = $this->root().'/requests/'.$operation->uuid;
        $temporary = $root.'.partial';
        File::deleteDirectory($temporary);
        File::ensureDirectoryExists($temporary, 02770, true);

        try {
            foreach ($required as $name => $maximum) {
                $asset = $assets[$name] ?? null;
                if (! is_array($asset) || ! $this->trustedAssetUrl($asset['url'] ?? null)) {
                    throw new RuntimeException('update_asset_untrusted');
                }
                if ((int) ($asset['size'] ?? 0) < 1 || (int) ($asset['size'] ?? 0) > $maximum) {
                    throw new RuntimeException('update_asset_size_invalid');
                }
                $response = Http::connectTimeout(5)->timeout(30)->get((string) $asset['url']);
                $response->throw();
                $body = $response->body();
                if ($body === '' || strlen($body) > $maximum) {
                    throw new RuntimeException('update_asset_size_invalid');
                }
                $expected = $this->digest($asset['digest'] ?? null);
                if ($expected !== null && ! hash_equals($expected, hash('sha256', $body))) {
                    throw new RuntimeException('update_asset_digest_invalid');
                }
                File::put($temporary.'/'.$name, $body, true);
            }
            File::put($temporary.'/request.json', json_encode([
                'schema' => 1,
                'operation_uuid' => $operation->uuid,
                'from_version' => $operation->from_version,
                'to_version' => $operation->to_version,
                'trigger' => $operation->trigger->value,
                'compatibility' => $operation->compatibility->value,
                'requested_at' => $operation->requested_at->toIso8601String(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n", true);
            if (! rename($temporary, $root)) {
                throw new RuntimeException('update_request_publish_failed');
            }
            File::put($this->root().'/queue/'.$operation->uuid.'.request', $operation->uuid."\n", true);
        } catch (\Throwable $exception) {
            File::deleteDirectory($temporary);
            throw $exception;
        }
    }

    public function root(): string
    {
        $root = $this->path();
        File::ensureDirectoryExists($root.'/requests', 02770, true);
        File::ensureDirectoryExists($root.'/queue', 02770, true);
        File::ensureDirectoryExists($root.'/status', 02770, true);

        return $root;
    }

    public function path(): string
    {
        return rtrim((string) config('netkeep.updates.exchange_path'), '/');
    }

    private function trustedAssetUrl(mixed $url): bool
    {
        return is_string($url)
            && preg_match('#^https://github\.com/lrqnet/NetKeep/releases/download/v\d+\.\d+\.\d+/[A-Za-z0-9._-]+$#', $url) === 1;
    }

    private function digest(mixed $digest): ?string
    {
        if (! is_string($digest) || preg_match('/^sha256:([a-f0-9]{64})$/', $digest, $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }
}
