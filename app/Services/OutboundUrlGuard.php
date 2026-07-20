<?php

namespace App\Services;

class OutboundUrlGuard
{
    public function __construct(private readonly ?NetworkTargetGuard $targets = null) {}

    public function assertAllowed(string $url): void
    {
        $this->resolveUrl($url);
    }

    /** @return array{scheme:string,host:string,port:int,addresses:list<string>} */
    public function resolveUrl(string $url): array
    {
        $parts = parse_url($url);
        if (! is_array($parts)) {
            throw new \InvalidArgumentException('outbound_url_invalid');
        }
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower(rtrim((string) ($parts['host'] ?? ''), '.'));
        if (
            ! in_array($scheme, ['http', 'https'], true)
            || $host === ''
            || isset($parts['user'])
            || isset($parts['pass'])
        ) {
            throw new \InvalidArgumentException('outbound_url_invalid');
        }

        try {
            $addresses = ($this->targets ?? new NetworkTargetGuard)->resolve($host);
        } catch (\Throwable) {
            throw new \InvalidArgumentException('outbound_target_blocked');
        }
        if ($addresses === []) {
            throw new \InvalidArgumentException('outbound_dns_empty');
        }
        $port = isset($parts['port'])
            ? (int) $parts['port']
            : ($scheme === 'https' ? 443 : 80);

        return compact('scheme', 'host', 'port', 'addresses');
    }
}
