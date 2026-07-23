<?php

namespace App\Services;

class CollectionTechnicalSanitizer
{
    private const MAX_MESSAGE_BYTES = 2048;

    private const SENSITIVE_KEYS = [
        'authorization',
        'community',
        'credential',
        'enable',
        'key',
        'passphrase',
        'passwd',
        'password',
        'private',
        'secret',
        'token',
    ];

    public function message(?string $message): ?string
    {
        if ($message === null || trim($message) === '') {
            return null;
        }

        $sanitized = preg_replace(
            '/-----BEGIN [^-\r\n]*PRIVATE KEY-----.*?-----END [^-\r\n]*PRIVATE KEY-----/is',
            '[REDACTED PRIVATE KEY]',
            $message,
        ) ?? $message;
        $sanitized = preg_replace(
            '~\b([a-z][a-z0-9+.-]*://)[^\s/@:]+(?::[^\s/@]*)?@~i',
            '$1[REDACTED]@',
            $sanitized,
        ) ?? $sanitized;
        $sanitized = preg_replace(
            '/\b(password|passwd|passphrase|secret|token|community|private_key|enable(?:_secret)?)\b(?:\s+(?:password|secret))?\s*(?:[:=]|\bis\b)?[^\r\n,;]*/iu',
            '$1=[REDACTED]',
            $sanitized,
        ) ?? $sanitized;
        $sanitized = preg_replace(
            '/\b(Bearer|Basic)\s+[A-Za-z0-9._~+\/=:-]+/i',
            '$1 [REDACTED]',
            $sanitized,
        ) ?? $sanitized;
        $sanitized = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $sanitized) ?? $sanitized;

        return mb_strcut(trim($sanitized), 0, self::MAX_MESSAGE_BYTES, 'UTF-8');
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function context(array $context): array
    {
        $sanitized = [];
        foreach (array_slice($context, 0, 50, true) as $key => $value) {
            $normalized = strtolower((string) $key);
            if ($this->isSensitiveKey($normalized)) {
                $sanitized[$key] = '[REDACTED]';

                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->context($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = $this->message($value);
            } elseif (is_bool($value) || is_int($value) || is_float($value) || $value === null) {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    private function isSensitiveKey(string $key): bool
    {
        foreach (self::SENSITIVE_KEYS as $fragment) {
            if (str_contains($key, $fragment)) {
                return true;
            }
        }

        return false;
    }
}
