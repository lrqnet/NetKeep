<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;

class BackupV2Validator
{
    /**
     * @param  array<string, string>  $actualHashes
     * @return array<string, mixed>
     */
    public function validate(string $root, array $actualHashes): array
    {
        $manifestPath = $root.'/manifest.json';
        if (! is_file($manifestPath) || filesize($manifestPath) > 67108864) {
            throw new RuntimeException('restore_manifest_invalid');
        }
        $manifest = json_decode(File::get($manifestPath), true, flags: JSON_THROW_ON_ERROR);
        if (
            ($manifest['format'] ?? null) !== 2
            || ! is_string($manifest['archive_uuid'] ?? null)
            || ! preg_match('/^[0-9a-f-]{36}$/i', $manifest['archive_uuid'])
            || ($manifest['compression'] ?? null) !== 'gzip'
            || ! is_array($manifest['files'] ?? null)
        ) {
            throw new RuntimeException('restore_manifest_incompatible');
        }

        $expectedHashes = $manifest['files'];
        unset($actualHashes['manifest.json']);
        ksort($expectedHashes);
        ksort($actualHashes);
        if (array_keys($expectedHashes) !== array_keys($actualHashes)) {
            throw new RuntimeException('restore_manifest_file_set_mismatch');
        }
        foreach ($expectedHashes as $path => $expected) {
            if (
                ! is_string($path)
                || ! is_string($expected)
                || ! isset($actualHashes[$path])
                || ! hash_equals($expected, $actualHashes[$path])
            ) {
                throw new RuntimeException('restore_file_hash_mismatch');
            }
        }

        $this->validateDatabase($root, $manifest['database'] ?? null);
        $this->validateSecrets($root);
        $this->validateVersion((string) ($manifest['netkeep_version'] ?? ''));

        return $manifest;
    }

    private function validateDatabase(string $root, mixed $database): void
    {
        if (
            ! is_array($database)
            || ! is_int($database['chunks'] ?? null)
            || $database['chunks'] < 1
            || ! is_int($database['bytes'] ?? null)
            || ! is_string($database['sha256'] ?? null)
        ) {
            throw new RuntimeException('restore_database_manifest_invalid');
        }
        $hash = hash_init('sha256');
        $bytes = 0;
        for ($index = 1; $index <= $database['chunks']; $index++) {
            $path = $root.'/'.sprintf('database/%08d.sqlpart', $index);
            $input = fopen($path, 'rb');
            if ($input === false) {
                throw new RuntimeException('restore_database_chunk_missing');
            }
            try {
                while (! feof($input)) {
                    $chunk = fread($input, 1048576);
                    if ($chunk === false) {
                        throw new RuntimeException('restore_database_chunk_unreadable');
                    }
                    $bytes += strlen($chunk);
                    hash_update($hash, $chunk);
                }
            } finally {
                fclose($input);
            }
        }
        if (
            $bytes !== $database['bytes']
            || ! hash_equals($database['sha256'], hash_final($hash))
        ) {
            throw new RuntimeException('restore_database_hash_mismatch');
        }
    }

    private function validateSecrets(string $root): void
    {
        $appKey = trim(File::get($root.'/secrets/app_key'));
        $encoded = str_starts_with($appKey, 'base64:') ? substr($appKey, 7) : '';
        $decoded = base64_decode($encoded, true);
        if ($decoded === false || strlen($decoded) !== 32) {
            throw new RuntimeException('restore_app_key_invalid');
        }
        if (strlen(trim(File::get($root.'/secrets/passkey_secret'))) < 32) {
            throw new RuntimeException('restore_passkey_secret_invalid');
        }
    }

    private function validateVersion(string $backupVersion): void
    {
        $current = (string) config('netkeep.version');
        if ($current === 'dev' || $backupVersion === 'dev') {
            return;
        }
        preg_match('/^(\d+)/', $current, $currentMatch);
        preg_match('/^(\d+)/', $backupVersion, $backupMatch);
        if (($currentMatch[1] ?? null) !== ($backupMatch[1] ?? null)) {
            throw new RuntimeException('restore_major_version_incompatible');
        }
    }
}
