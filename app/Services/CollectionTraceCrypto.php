<?php

namespace App\Services;

use App\Models\CollectionRun;
use App\Models\CollectionRunArtifact;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class CollectionTraceCrypto
{
    private const MAGIC = "NKTRACE1\n";

    private const CHUNK_SIZE = 65536;

    /** @param resource $stream */
    public function store(CollectionRun $run, $stream, bool $truncated = false): CollectionRunArtifact
    {
        if (! is_resource($stream)) {
            throw new RuntimeException('trace_stream_invalid');
        }
        $existing = $run->artifacts()->where('type', 'raw_trace')->first();
        if ($existing) {
            return $existing;
        }

        $directory = $this->directory();
        File::ensureDirectoryExists($directory, 0700, true);
        $directoryStat = @lstat($directory);
        if ($directoryStat === false || ($directoryStat['mode'] & 0170000) !== 0040000) {
            throw new RuntimeException('trace_storage_unavailable');
        }
        chmod($directory, 0700);
        $uuid = (string) Str::uuid();
        $relativePath = $uuid.'.trace';
        $target = $directory.'/'.$relativePath;
        $temporary = $target.'.tmp';
        $output = fopen($temporary, 'xb');
        if ($output === false) {
            throw new RuntimeException('trace_storage_unavailable');
        }

        chmod($temporary, 0600);
        $size = 0;
        $maxBytes = (int) config('netkeep.diagnostics.trace_max_bytes', 5 * 1024 * 1024);
        try {
            [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($this->key());
            $this->write($output, self::MAGIC.$header);
            while ($size < $maxBytes && ! feof($stream)) {
                $chunk = fread($stream, max(1, min(self::CHUNK_SIZE, $maxBytes - $size)));
                if ($chunk === false) {
                    throw new RuntimeException('trace_stream_read_failed');
                }
                if ($chunk === '') {
                    break;
                }
                $size += strlen($chunk);
                $ciphertext = sodium_crypto_secretstream_xchacha20poly1305_push(
                    $state,
                    $chunk,
                    $uuid,
                    SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE,
                );
                $this->writeFrame($output, $ciphertext);
            }
            if ($size === $maxBytes && ! feof($stream)) {
                $truncated = $truncated || fread($stream, 1) !== '';
            }
            $final = sodium_crypto_secretstream_xchacha20poly1305_push(
                $state,
                '',
                $uuid,
                SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL,
            );
            $this->writeFrame($output, $final);
            fflush($output);
        } catch (\Throwable $exception) {
            fclose($output);
            @unlink($temporary);

            throw $exception;
        }
        fclose($output);
        if (! rename($temporary, $target)) {
            @unlink($temporary);
            throw new RuntimeException('trace_storage_unavailable');
        }

        $checksum = hash_file('sha256', $target);
        if ($checksum === false) {
            @unlink($target);
            throw new RuntimeException('trace_storage_unavailable');
        }

        try {
            return CollectionRunArtifact::query()->create([
                'uuid' => $uuid,
                'collection_run_id' => $run->id,
                'type' => 'raw_trace',
                'encrypted_path' => $relativePath,
                'encryption_version' => 'secretstream-v1',
                'size' => $size,
                'checksum' => $checksum,
                'truncated' => $truncated,
                'expires_at' => now()->addHours((int) config('netkeep.diagnostics.trace_retention_hours', 24)),
                'purged_at' => null,
            ]);
        } catch (QueryException $exception) {
            @unlink($target);
            $existing = $run->artifacts()->where('type', 'raw_trace')->first();
            if ($existing) {
                return $existing;
            }

            throw $exception;
        } catch (\Throwable $exception) {
            @unlink($target);

            throw $exception;
        }
    }

    public function decrypt(CollectionRunArtifact $artifact): string
    {
        if ($artifact->encryption_version !== 'secretstream-v1') {
            throw new RuntimeException('trace_encryption_version_unsupported');
        }
        $path = $this->path($artifact);
        $checksum = hash_file('sha256', $path);
        if ($checksum === false || ! hash_equals((string) $artifact->checksum, $checksum)) {
            throw new RuntimeException('trace_checksum_mismatch');
        }
        $input = fopen($path, 'rb');
        if ($input === false) {
            throw new RuntimeException('trace_unavailable');
        }

        try {
            $prefix = $this->readExact($input, strlen(self::MAGIC));
            if (! hash_equals(self::MAGIC, $prefix)) {
                throw new RuntimeException('trace_format_invalid');
            }
            $header = $this->readExact(
                $input,
                SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_HEADERBYTES,
            );
            $state = sodium_crypto_secretstream_xchacha20poly1305_init_pull($header, $this->key());
            $plaintext = '';
            $finished = false;
            while (! feof($input)) {
                $lengthBytes = fread($input, 4);
                if ($lengthBytes === false || $lengthBytes === '') {
                    break;
                }
                if (strlen($lengthBytes) !== 4) {
                    throw new RuntimeException('trace_format_invalid');
                }
                $unpacked = unpack('Nlength', $lengthBytes);
                if (! is_array($unpacked) || ! isset($unpacked['length'])) {
                    throw new RuntimeException('trace_format_invalid');
                }
                $length = $unpacked['length'];
                if ($length < SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_ABYTES || $length > self::CHUNK_SIZE + 1024) {
                    throw new RuntimeException('trace_format_invalid');
                }
                $ciphertext = $this->readExact($input, $length);
                $result = sodium_crypto_secretstream_xchacha20poly1305_pull(
                    $state,
                    $ciphertext,
                    $artifact->uuid,
                );
                if ($result === false) {
                    throw new RuntimeException('trace_authentication_failed');
                }
                [$message, $tag] = $result;
                $plaintext .= $message;
                if (strlen($plaintext) > (int) config('netkeep.diagnostics.trace_max_bytes', 5 * 1024 * 1024)) {
                    throw new RuntimeException('trace_format_invalid');
                }
                if ($tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL) {
                    $finished = true;
                    break;
                }
            }
            if (! $finished) {
                throw new RuntimeException('trace_incomplete');
            }

            return $plaintext;
        } finally {
            fclose($input);
        }
    }

    public function purge(CollectionRunArtifact $artifact): void
    {
        if ($artifact->purged_at !== null) {
            return;
        }

        if ($artifact->encrypted_path !== null) {
            $path = $this->directory().'/'.basename($artifact->encrypted_path);
            $stat = @lstat($path);
            if ($stat !== false && ($stat['mode'] & 0170000) === 0100000) {
                @unlink($path);
            }
        }
        $artifact->forceFill([
            'encrypted_path' => null,
            'checksum' => null,
            'purged_at' => now(),
        ])->save();
    }

    private function key(): string
    {
        $configured = (string) config('app.key');
        if (str_starts_with($configured, 'base64:')) {
            $decoded = base64_decode(substr($configured, 7), true);
            if ($decoded === false) {
                throw new RuntimeException('app_key_invalid');
            }
            $configured = $decoded;
        }
        if ($configured === '') {
            throw new RuntimeException('app_key_missing');
        }

        return hash_hkdf('sha256', $configured, SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES, 'netkeep:collection-trace:v1');
    }

    private function directory(): string
    {
        $directory = rtrim((string) config('netkeep.diagnostics.trace_path'), '/');
        if ($directory === '') {
            throw new RuntimeException('trace_storage_unavailable');
        }
        if (File::exists($directory)) {
            $stat = @lstat($directory);
            if ($stat === false || ($stat['mode'] & 0170000) !== 0040000) {
                throw new RuntimeException('trace_storage_unavailable');
            }
        }

        return $directory;
    }

    private function path(CollectionRunArtifact $artifact): string
    {
        if ($artifact->purged_at !== null || $artifact->encrypted_path === null || $artifact->expires_at->isPast()) {
            throw new RuntimeException('trace_expired');
        }
        if ($artifact->encrypted_path !== basename($artifact->encrypted_path)) {
            throw new RuntimeException('trace_path_invalid');
        }
        $path = $this->directory().'/'.$artifact->encrypted_path;
        $stat = @lstat($path);
        if ($stat === false || ($stat['mode'] & 0170000) !== 0100000) {
            throw new RuntimeException('trace_unavailable');
        }

        return $path;
    }

    /** @param resource $stream */
    private function writeFrame($stream, string $ciphertext): void
    {
        $this->write($stream, pack('N', strlen($ciphertext)).$ciphertext);
    }

    /** @param resource $stream */
    private function write($stream, string $contents): void
    {
        $offset = 0;
        while ($offset < strlen($contents)) {
            $written = fwrite($stream, substr($contents, $offset));
            if ($written === false || $written === 0) {
                throw new RuntimeException('trace_storage_unavailable');
            }
            $offset += $written;
        }
    }

    /** @param resource $stream */
    private function readExact($stream, int $length): string
    {
        $contents = '';
        while (strlen($contents) < $length) {
            $chunk = fread($stream, max(1, $length - strlen($contents)));
            if ($chunk === false || $chunk === '') {
                throw new RuntimeException('trace_format_invalid');
            }
            $contents .= $chunk;
        }

        return $contents;
    }
}
