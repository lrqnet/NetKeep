<?php

namespace App\Services;

use RuntimeException;

class GzipStreamWriter
{
    private \DeflateContext $context;

    public function __construct(private readonly \Closure $write)
    {
        $context = deflate_init(ZLIB_ENCODING_GZIP, ['level' => 6]);
        if ($context === false) {
            throw new RuntimeException('backup_compressor_unavailable');
        }
        $this->context = $context;
    }

    public function write(string $content): void
    {
        $compressed = deflate_add($this->context, $content, ZLIB_NO_FLUSH);
        if ($compressed === false) {
            throw new RuntimeException('backup_compression_failed');
        }
        if ($compressed !== '') {
            ($this->write)($compressed);
        }
    }

    public function finish(): void
    {
        $compressed = deflate_add($this->context, '', ZLIB_FINISH);
        if ($compressed === false) {
            throw new RuntimeException('backup_compression_failed');
        }
        if ($compressed !== '') {
            ($this->write)($compressed);
        }
    }
}
