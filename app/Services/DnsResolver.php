<?php

namespace App\Services;

class DnsResolver
{
    /** @return list<string> */
    public function resolve(string $host): array
    {
        set_error_handler(static fn (): bool => true);

        try {
            $records = dns_get_record($host, DNS_A | DNS_AAAA);
        } catch (\Throwable) {
            $records = false;
        } finally {
            restore_error_handler();
        }

        if (! is_array($records)) {
            return [];
        }

        $addresses = [];
        foreach ($records as $record) {
            $address = $record['ip'] ?? $record['ipv6'] ?? null;
            if (is_string($address)) {
                $addresses[] = strtolower($address);
            }
        }

        return array_values(array_unique($addresses));
    }
}
