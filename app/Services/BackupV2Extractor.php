<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;

class BackupV2Extractor
{
    private \InflateContext $inflate;

    private string $buffer = '';

    /** @var resource|null */
    private $handle = null;

    private ?\HashContext $hash = null;

    private ?string $currentPath = null;

    private int $remaining = 0;

    private int $currentSize = 0;

    private int $padding = 0;

    private int $zeroBlocks = 0;

    private int $fileCount = 0;

    private int $expandedSize = 0;

    private bool $finished = false;

    /** @var array<string, string> */
    private array $hashes = [];

    public function __construct(
        private readonly string $root,
        private readonly int $maxExpandedSize,
        private readonly int $maxFiles,
    ) {
        File::ensureDirectoryExists($root, 0700, true);
        $inflate = inflate_init(ZLIB_ENCODING_GZIP);
        if ($inflate === false) {
            throw new RuntimeException('restore_decompressor_unavailable');
        }
        $this->inflate = $inflate;
    }

    public function feed(string $compressed): void
    {
        $plain = inflate_add($this->inflate, $compressed, ZLIB_SYNC_FLUSH);
        if ($plain === false) {
            throw new RuntimeException('restore_compressed_stream_invalid');
        }
        $this->consume($plain);
    }

    /** @return array<string, string> */
    public function finish(): array
    {
        $plain = inflate_add($this->inflate, '', ZLIB_FINISH);
        if ($plain === false) {
            throw new RuntimeException('restore_compressed_stream_incomplete');
        }
        $this->consume($plain);
        $this->parse();
        if (! $this->finished || $this->handle !== null || trim($this->buffer, "\0") !== '') {
            throw new RuntimeException('restore_tar_incomplete');
        }

        return $this->hashes;
    }

    private function consume(string $plain): void
    {
        if ($plain === '') {
            return;
        }
        if (strlen($this->buffer) + strlen($plain) > 67108864) {
            throw new RuntimeException('restore_buffer_limit_exceeded');
        }
        $this->buffer .= $plain;
        $this->parse();
    }

    private function parse(): void
    {
        while ($this->buffer !== '') {
            if ($this->handle !== null) {
                if ($this->hash === null || $this->currentPath === null) {
                    throw new RuntimeException('restore_tar_state_invalid');
                }
                $length = min($this->remaining, strlen($this->buffer));
                $chunk = substr($this->buffer, 0, $length);
                $this->buffer = substr($this->buffer, $length);
                if ($chunk !== '' && fwrite($this->handle, $chunk) !== strlen($chunk)) {
                    throw new RuntimeException('restore_write_failed');
                }
                hash_update($this->hash, $chunk);
                $this->remaining -= $length;
                if ($this->remaining === 0) {
                    fclose($this->handle);
                    $this->handle = null;
                    $this->hashes[$this->currentPath] = hash_final($this->hash);
                    $this->padding = (512 - ($this->currentSize % 512)) % 512;
                    $this->currentPath = null;
                }

                continue;
            }
            if ($this->padding > 0) {
                $length = min($this->padding, strlen($this->buffer));
                if (trim(substr($this->buffer, 0, $length), "\0") !== '') {
                    throw new RuntimeException('restore_tar_padding_invalid');
                }
                $this->buffer = substr($this->buffer, $length);
                $this->padding -= $length;

                continue;
            }
            if (strlen($this->buffer) < 512) {
                return;
            }
            $header = substr($this->buffer, 0, 512);
            $this->buffer = substr($this->buffer, 512);
            if ($header === str_repeat("\0", 512)) {
                $this->zeroBlocks++;
                if ($this->zeroBlocks >= 2) {
                    $this->finished = true;
                }

                continue;
            }
            if ($this->finished) {
                throw new RuntimeException('restore_data_after_tar_end');
            }
            $this->zeroBlocks = 0;
            $this->openEntry($header);
        }
    }

    private function openEntry(string $header): void
    {
        $storedChecksum = $this->parseOctal(substr($header, 148, 8));
        $checksumHeader = substr_replace($header, str_repeat(' ', 8), 148, 8);
        $bytes = unpack('C*', $checksumHeader);
        if ($bytes === false) {
            throw new RuntimeException('restore_tar_checksum_invalid');
        }
        $calculatedChecksum = array_sum($bytes);
        if ($storedChecksum !== $calculatedChecksum) {
            throw new RuntimeException('restore_tar_checksum_invalid');
        }
        $type = $header[156];
        if ($type !== '0' && $type !== "\0") {
            throw new RuntimeException('restore_tar_entry_type_rejected');
        }

        $name = rtrim(substr($header, 0, 100), "\0");
        $prefix = rtrim(substr($header, 345, 155), "\0");
        $path = $prefix === '' ? $name : $prefix.'/'.$name;
        $this->assertPath($path);
        $size = $this->parseOctal(substr($header, 124, 12));
        $this->expandedSize += $size;
        $this->fileCount++;
        if (
            $size > $this->maxExpandedSize
            || $this->expandedSize > $this->maxExpandedSize
            || $this->fileCount > $this->maxFiles
        ) {
            throw new RuntimeException('restore_expansion_limit_exceeded');
        }

        $target = $this->root.'/'.$path;
        File::ensureDirectoryExists(dirname($target), 0700, true);
        $root = realpath($this->root);
        $parent = realpath(dirname($target));
        if ($root === false || $parent === false || ! str_starts_with($parent.'/', $root.'/')) {
            throw new RuntimeException('restore_path_escape_rejected');
        }
        $handle = fopen($target, 'xb');
        if ($handle === false) {
            throw new RuntimeException('restore_file_collision');
        }
        chmod($target, 0600);
        $this->handle = $handle;
        $this->hash = hash_init('sha256');
        $this->currentPath = $path;
        $this->remaining = $size;
        $this->currentSize = $size;
        if ($size === 0) {
            fclose($this->handle);
            $this->handle = null;
            $this->hashes[$path] = hash_final($this->hash);
            $this->currentPath = null;
        }
    }

    private function assertPath(string $path): void
    {
        if (
            $path === ''
            || str_starts_with($path, '/')
            || str_contains($path, "\0")
            || str_contains($path, '\\')
        ) {
            throw new RuntimeException('restore_path_invalid');
        }
        $parts = explode('/', $path);
        if (in_array('', $parts, true) || in_array('.', $parts, true) || in_array('..', $parts, true)) {
            throw new RuntimeException('restore_path_invalid');
        }
        $allowed = $path === 'manifest.json'
            || collect(['database/', 'repository/', 'model/', 'branding/', 'secrets/'])
                ->contains(fn (string $prefix): bool => str_starts_with($path, $prefix));
        if (! $allowed) {
            throw new RuntimeException('restore_path_not_allowed');
        }
    }

    private function parseOctal(string $value): int
    {
        $value = trim($value, "\0 ");
        if ($value === '' || ! preg_match('/^[0-7]+$/', $value)) {
            throw new RuntimeException('restore_tar_number_invalid');
        }

        return (int) octdec($value);
    }
}
