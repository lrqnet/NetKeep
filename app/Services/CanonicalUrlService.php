<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;

class CanonicalUrlService
{
    public function normalize(string $url): string
    {
        $parts = parse_url($url);
        $host = (string) ($parts['host'] ?? '');
        $path = (string) ($parts['path'] ?? '');
        if (
            ($parts['scheme'] ?? null) !== 'https'
            || $host === ''
            || ! in_array($path, ['', '/'], true)
            || isset($parts['query'])
            || isset($parts['fragment'])
            || isset($parts['user'])
            || isset($parts['pass'])
        ) {
            throw new \InvalidArgumentException('canonical_url_origin_only');
        }
        $hostValue = str_contains($host, ':') ? "[{$host}]" : strtolower($host);
        $port = isset($parts['port']) ? ':'.(int) $parts['port'] : '';

        return "https://{$hostValue}{$port}";
    }

    public function url(): ?string
    {
        if (! Schema::hasTable('organizations')) {
            return null;
        }

        $organization = Organization::query()->first();
        if (! $organization) {
            return null;
        }

        if (filled($organization->canonical_url)) {
            return rtrim((string) $organization->canonical_url, '/');
        }

        return filled($organization->domain) ? 'https://'.strtolower((string) $organization->domain) : null;
    }

    public function configure(): void
    {
        $url = $this->url();
        if (! $url) {
            return;
        }

        $host = parse_url($url, PHP_URL_HOST);
        config([
            'app.url' => $url,
            'fortify.passkeys.relying_party_id' => $host,
            'fortify.passkeys.allowed_origins' => [$url],
            'passkeys.relying_party_id' => $host,
            'passkeys.allowed_origins' => [$url],
        ]);
        URL::forceRootUrl($url);
        URL::forceScheme('https');
    }
}
