<?php

namespace App\Services;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;

class TarStreamWriter
{
    /** @var array<string, string> */
    private array $hashes = [];

    public function __construct(private readonly \Closure $write) {}

    public function addString(string $path, string $content, int $mode = 0600): void
    {
        $this->header($path, strlen($content), $mode);
        ($this->write)($content);
        $this->padding(strlen($content));
        $this->hashes[$path] = hash('sha256', $content);
    }

    public function addFile(string $path, string $source, int $mode = 0600): void
    {
        if (! is_file($source) || is_link($source)) {
            throw new RuntimeException('backup_source_invalid');
        }

        $size = filesize($source);
        $input = fopen($source, 'rb');
        if ($size === false || $input === false) {
            throw new RuntimeException('backup_source_unreadable');
        }

        $this->header($path, $size, $mode);
        $hash = hash_init('sha256');
        try {
            while (! feof($input)) {
                $chunk = fread($input, 1048576);
                if ($chunk === false) {
                    throw new RuntimeException('backup_source_read_failed');
                }
                if ($chunk !== '') {
                    hash_update($hash, $chunk);
                    ($this->write)($chunk);
                }
            }
        } finally {
            fclose($input);
        }
        $this->padding($size);
        $this->hashes[$path] = hash_final($hash);
    }

    public function addDirectory(string $prefix, string $source): void
    {
        if (! is_dir($source) || is_link($source)) {
            return;
        }

        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
        );
        foreach ($iterator as $file) {
            if (! $file instanceof SplFileInfo || $file->isLink()) {
                throw new RuntimeException('backup_symlink_rejected');
            }
            if ($file->isFile()) {
                $relative = substr($file->getPathname(), strlen(rtrim($source, DIRECTORY_SEPARATOR)) + 1);
                $files[str_replace(DIRECTORY_SEPARATOR, '/', $relative)] = $file->getPathname();
            }
        }
        ksort($files);

        foreach ($files as $relative => $path) {
            $this->addFile(trim($prefix, '/').'/'.$relative, $path, 0640);
        }
    }

    public function finish(): void
    {
        ($this->write)(str_repeat("\0", 1024));
    }

    /** @return array<string, string> */
    public function hashes(): array
    {
        return $this->hashes;
    }

    private function header(string $path, int $size, int $mode): void
    {
        if ($path === '' || str_starts_with($path, '/') || str_contains($path, '..')) {
            throw new RuntimeException('backup_path_invalid');
        }

        [$name, $prefix] = $this->splitPath($path);
        $header = str_pad($name, 100, "\0")
            .$this->octal($mode, 8)
            .$this->octal(0, 8)
            .$this->octal(0, 8)
            .$this->octal($size, 12)
            .$this->octal(time(), 12)
            .str_repeat(' ', 8)
            .'0'
            .str_repeat("\0", 100)
            ."ustar\0"
            .'00'
            .str_pad('netkeep', 32, "\0")
            .str_pad('netkeep', 32, "\0")
            .$this->octal(0, 8)
            .$this->octal(0, 8)
            .str_pad($prefix, 155, "\0")
            .str_repeat("\0", 12);
        $checksum = 0;
        for ($index = 0; $index < 512; $index++) {
            $checksum += ord($header[$index]);
        }
        $checksumValue = sprintf('%06o', $checksum)."\0 ";
        $header = substr_replace($header, $checksumValue, 148, 8);
        ($this->write)($header);
    }

    /** @return array{string,string} */
    private function splitPath(string $path): array
    {
        if (strlen($path) <= 100) {
            return [$path, ''];
        }
        if (strlen($path) > 255) {
            throw new RuntimeException('backup_path_too_long');
        }

        $position = strrpos(substr($path, 0, 156), '/');
        if ($position === false) {
            throw new RuntimeException('backup_path_too_long');
        }
        $prefix = substr($path, 0, $position);
        $name = substr($path, $position + 1);
        if (strlen($prefix) > 155 || strlen($name) > 100) {
            throw new RuntimeException('backup_path_too_long');
        }

        return [$name, $prefix];
    }

    private function octal(int $value, int $length): string
    {
        return str_pad(decoct($value), $length - 1, '0', STR_PAD_LEFT)."\0";
    }

    private function padding(int $size): void
    {
        $remainder = $size % 512;
        if ($remainder !== 0) {
            ($this->write)(str_repeat("\0", 512 - $remainder));
        }
    }
}
