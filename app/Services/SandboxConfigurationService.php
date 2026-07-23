<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;

class SandboxConfigurationService
{
    public function activateDiagnostic(): string
    {
        $target = $this->target();
        if (! File::isFile($target)) {
            throw new RuntimeException('sandbox_config_missing');
        }
        $previous = File::get($target);
        $lines = preg_split('/\R/', $previous);
        if ($lines === false) {
            throw new RuntimeException('sandbox_config_invalid');
        }

        $section = null;
        $inputDebug = false;
        $gitRepo = false;
        foreach ($lines as $index => $line) {
            if (preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*:/', $line) === 1) {
                $section = strtok($line, ':');
            }
            if ($section === 'input' && preg_match('/^  debug:/', $line) === 1) {
                $lines[$index] = '  debug: true';
                $inputDebug = true;
            }
            if ($section === 'output' && preg_match('/^    repo:/', $line) === 1) {
                $lines[$index] = '    repo: /run/netkeep-diagnostics/repository';
                $gitRepo = true;
            }
        }
        if (! $inputDebug || ! $gitRepo) {
            throw new RuntimeException('sandbox_config_invalid');
        }

        $this->atomicWrite($target, implode("\n", $lines));

        return $previous;
    }

    public function restore(string $content): void
    {
        $this->atomicWrite($this->target(), $content);
    }

    private function target(): string
    {
        return rtrim((string) config('netkeep.sandbox.config_path'), '/').'/config';
    }

    private function atomicWrite(string $target, string $content): void
    {
        $temporary = $target.'.'.bin2hex(random_bytes(8)).'.tmp';
        if (File::put($temporary, $content, true) === false) {
            throw new RuntimeException('sandbox_config_write_failed');
        }
        chmod($temporary, 0640);
        if (! rename($temporary, $target)) {
            @unlink($temporary);
            throw new RuntimeException('sandbox_config_write_failed');
        }
    }
}
