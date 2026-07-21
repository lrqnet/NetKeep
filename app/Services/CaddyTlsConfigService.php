<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class CaddyTlsConfigService
{
    public function configure(?string $canonicalUrl, bool $reload = true): bool
    {
        $target = (string) config('netkeep.caddy_dynamic_path', '/config/netkeep-canonical.caddy');
        $globalTarget = (string) config('netkeep.caddy_global_path', '/config/netkeep-global.caddy');
        if (app()->environment('testing') && str_starts_with($target, '/config/')) {
            return false;
        }

        $content = $this->siteContent($canonicalUrl);
        $globalContent = $this->globalContent($canonicalUrl);
        $previous = is_file($target) ? File::get($target) : '';
        $previousGlobal = is_file($globalTarget) ? File::get($globalTarget) : '';
        $changed = $content !== $previous || $globalContent !== $previousGlobal;
        if (! $changed) {
            return false;
        }

        File::ensureDirectoryExists(dirname($target), 0700, true);

        try {
            $this->atomicWrite($target, $content);
            $this->atomicWrite($globalTarget, $globalContent);
            $this->caddy('validate');
        } catch (\Throwable $exception) {
            $this->atomicWrite($target, $previous);
            $this->atomicWrite($globalTarget, $previousGlobal);
            throw $exception;
        }

        if ($reload) {
            $this->scheduleReload();
        }

        return $reload;
    }

    public function isReady(?string $canonicalUrl): bool
    {
        $host = $canonicalUrl ? (string) parse_url($canonicalUrl, PHP_URL_HOST) : '';
        if (filter_var($host, FILTER_VALIDATE_IP) === false) {
            return $host !== '';
        }

        $host = strtolower($host);
        $dataRoot = rtrim((string) config('netkeep.caddy_data_path', '/data/caddy'), '/');
        $certificate = "{$dataRoot}/certificates/local/{$host}/{$host}.crt";
        clearstatcache(true, $certificate);

        return is_file($certificate) && filesize($certificate) > 0;
    }

    private function siteContent(?string $canonicalUrl): string
    {
        $host = $canonicalUrl ? (string) parse_url($canonicalUrl, PHP_URL_HOST) : '';
        if (filter_var($host, FILTER_VALIDATE_IP) === false) {
            return '';
        }

        $address = str_contains($host, ':') ? "[{$host}]" : $host;

        return "https://{$address}:8443 {\n\ttls internal\n\timport netkeep_app\n}\n";
    }

    private function globalContent(?string $canonicalUrl): string
    {
        $host = $canonicalUrl ? (string) parse_url($canonicalUrl, PHP_URL_HOST) : '';

        return filter_var($host, FILTER_VALIDATE_IP) === false
            ? ''
            : "default_sni {$host}\n";
    }

    private function caddy(string $action): void
    {
        $process = new Process([
            'frankenphp',
            $action,
            '--config',
            '/etc/frankenphp/Caddyfile',
            '--adapter',
            'caddyfile',
        ]);
        $process->setTimeout(30);
        $process->mustRun();
    }

    private function scheduleReload(): void
    {
        $process = new Process([
            '/bin/sh',
            '-c',
            '(sleep 1; kill -USR1 1) >/dev/null 2>&1 &',
        ]);
        $process->setTimeout(5);
        $process->mustRun();
    }

    private function atomicWrite(string $target, string $content): void
    {
        $temporary = $target.'.'.bin2hex(random_bytes(8)).'.partial';
        if (File::put($temporary, $content, true) === false) {
            throw new RuntimeException('caddy_dynamic_config_write_failed');
        }
        chmod($temporary, 0640);
        if (! rename($temporary, $target)) {
            File::delete($temporary);
            throw new RuntimeException('caddy_dynamic_config_write_failed');
        }
    }
}
