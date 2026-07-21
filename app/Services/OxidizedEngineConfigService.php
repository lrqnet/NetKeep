<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;

class OxidizedEngineConfigService
{
    public function __construct(private OxidizedClient $oxidized) {}

    public function configure(int $threads): void
    {
        if ($threads < 1 || $threads > 20) {
            throw new RuntimeException('oxidized_threads_out_of_range');
        }

        $target = rtrim((string) config('netkeep.oxidized.config_path'), '/').'/config';
        if (! File::isFile($target)) {
            throw new RuntimeException('oxidized_config_missing');
        }

        $previous = File::get($target);
        $updated = $this->replaceTopLevel($previous, 'interval', '0');
        $updated = $this->replaceTopLevel($updated, 'threads', (string) $threads);
        $updated = $this->replaceTopLevel($updated, 'use_max_threads', 'false');
        $updated = $this->replaceTopLevel($updated, 'retries', '0');
        $updated = $this->replaceTopLevel($updated, 'next_adds_job', 'false');
        $updated = $this->secureSsh($updated);

        $this->atomicWrite($target, $updated);
        if ($this->oxidized->reload()) {
            return;
        }

        $this->atomicWrite($target, $previous);
        $this->oxidized->reload();

        throw new RuntimeException('oxidized_reload_failed');
    }

    private function replaceTopLevel(string $content, string $key, string $value): string
    {
        $pattern = '/^'.preg_quote($key, '/').':.*$/m';
        if (preg_match($pattern, $content) === 1) {
            return (string) preg_replace($pattern, "{$key}: {$value}", $content, 1);
        }

        return rtrim($content)."\n{$key}: {$value}\n";
    }

    private function secureSsh(string $content): string
    {
        if (preg_match('/^    secure:.*$/m', $content) === 1) {
            return (string) preg_replace('/^    secure:.*$/m', '    secure: true', $content, 1);
        }

        if (preg_match('/^  ssh:\s*$/m', $content) !== 1) {
            throw new RuntimeException('oxidized_ssh_config_missing');
        }

        return (string) preg_replace('/^  ssh:\s*$/m', "  ssh:\n    secure: true", $content, 1);
    }

    private function atomicWrite(string $target, string $content): void
    {
        $temporary = $target.'.'.bin2hex(random_bytes(8)).'.tmp';
        if (File::put($temporary, $content, true) === false) {
            throw new RuntimeException('oxidized_config_write_failed');
        }
        chmod($temporary, 0640);
        if (! rename($temporary, $target)) {
            @unlink($temporary);
            throw new RuntimeException('oxidized_config_write_failed');
        }
    }
}
