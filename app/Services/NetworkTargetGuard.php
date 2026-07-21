<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class NetworkTargetGuard
{
    public function __construct(private readonly ?DnsResolver $dnsResolver = null) {}

    private const BLOCKED_HOSTS = [
        'app',
        'postgres',
        'oxidized',
        'wud',
        'sandbox',
        'recovery',
        'init',
        'worker',
        'scheduler',
        'localhost',
        'metadata.google.internal',
    ];

    private const BLOCKED_IPV4_RANGES = [
        ['0.0.0.0', 8],
        ['127.0.0.0', 8],
        ['169.254.0.0', 16],
        ['224.0.0.0', 4],
        ['240.0.0.0', 4],
        ['100.100.100.200', 32],
    ];

    /** @return list<string> */
    public function resolve(string $target): array
    {
        $normalized = strtolower(rtrim(trim($target), '.'));
        if ($normalized === '' || in_array($normalized, self::BLOCKED_HOSTS, true)) {
            $this->reject();
        }

        if (str_ends_with($normalized, '.localhost')) {
            $this->reject();
        }

        if (filter_var($normalized, FILTER_VALIDATE_IP)) {
            $addresses = [$normalized];
        } else {
            if (! filter_var($normalized, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                $this->reject();
            }

            $addresses = $this->resolver()->resolve($normalized);
        }

        if ($addresses === []) {
            $this->reject();
        }

        foreach ($addresses as $address) {
            $this->assertAllowedAddress($address);
        }

        return $addresses;
    }

    /**
     * @param  list<string>  $approvedAddresses
     * @return list<string>
     */
    public function assertApprovedResolution(string $target, array $approvedAddresses): array
    {
        $current = $this->resolve($target);
        $approved = collect($approvedAddresses)->map(fn (string $ip): string => strtolower($ip))->sort()->values()->all();
        $resolved = collect($current)->map(fn (string $ip): string => strtolower($ip))->sort()->values()->all();

        if ($approved === [] || $approved !== $resolved) {
            throw ValidationException::withMessages([
                'target' => __('netkeep.security.target_resolution_changed'),
            ]);
        }

        return $current;
    }

    public function assertAllowedAddress(string $address): void
    {
        if (! filter_var($address, FILTER_VALIDATE_IP)) {
            $this->reject();
        }

        $binary = inet_pton($address);
        if ($binary === false) {
            $this->reject();
        }

        if (strlen($binary) === 4) {
            foreach (self::BLOCKED_IPV4_RANGES as [$network, $prefix]) {
                if ($this->matchesCidr($binary, inet_pton($network), $prefix)) {
                    $this->reject();
                }
            }
        } elseif (
            $binary === str_repeat("\0", 16)
            || $binary === str_repeat("\0", 15)."\1"
            || $this->matchesCidr($binary, inet_pton('fe80::'), 10)
            || $this->matchesCidr($binary, inet_pton('ff00::'), 8)
            || $this->matchesCidr($binary, inet_pton('::ffff:0:0'), 96)
        ) {
            $this->reject();
        }

        if (in_array(strtolower($address), $this->internalServiceAddresses(), true)) {
            $this->reject();
        }
    }

    private function matchesCidr(string $address, string|false $network, int $prefix): bool
    {
        if ($network === false || strlen($address) !== strlen($network)) {
            return false;
        }

        $bytes = intdiv($prefix, 8);
        $bits = $prefix % 8;
        if (substr($address, 0, $bytes) !== substr($network, 0, $bytes)) {
            return false;
        }

        if ($bits === 0) {
            return true;
        }

        $mask = (0xFF << (8 - $bits)) & 0xFF;

        return (ord($address[$bytes]) & $mask) === (ord($network[$bytes]) & $mask);
    }

    private function reject(): never
    {
        throw ValidationException::withMessages([
            'target' => __('netkeep.security.target_blocked'),
        ]);
    }

    /** @return list<string> */
    private function internalServiceAddresses(): array
    {
        $addresses = [];
        foreach (self::BLOCKED_HOSTS as $host) {
            if (filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                $addresses = [...$addresses, ...$this->resolver()->resolve($host)];
            }
        }

        return array_values(array_unique($addresses));
    }

    private function resolver(): DnsResolver
    {
        return $this->dnsResolver ?? new DnsResolver;
    }
}
