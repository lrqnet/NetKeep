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
            $this->scheduleReload($canonicalUrl);
        }

        return $reload;
    }

    public function isReady(?string $canonicalUrl): bool
    {
        $host = $this->host($canonicalUrl);
        if (filter_var($host, FILTER_VALIDATE_IP) === false) {
            return $host !== '';
        }

        $dataRoot = rtrim((string) config('netkeep.caddy_data_path', '/data/caddy'), '/');
        $certificate = "{$dataRoot}/certificates/local/{$host}/{$host}.crt";
        clearstatcache(true, $certificate);

        return is_file($certificate) && filesize($certificate) > 0;
    }

    private function siteContent(?string $canonicalUrl): string
    {
        $host = $this->host($canonicalUrl);
        if (filter_var($host, FILTER_VALIDATE_IP) === false) {
            return '';
        }

        return "http://127.0.0.1:8081 {\n"
            ."\t@canonical query domain={$host}\n"
            ."\trespond @canonical 200\n"
            ."\trewrite * /internal/caddy/ask\n"
            ."\treverse_proxy http://127.0.0.1:8080\n"
            ."}\n";
    }

    private function globalContent(?string $canonicalUrl): string
    {
        $host = $this->host($canonicalUrl);

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return "cert_issuer internal\n"
                ."default_sni {$host}\n"
                ."on_demand_tls {\n"
                ."\task http://127.0.0.1:8081\n"
                ."}\n";
        }

        return "cert_issuer acme\n"
            ."cert_issuer internal\n"
            ."on_demand_tls {\n"
            ."\task http://127.0.0.1:8080/internal/caddy/ask\n"
            ."}\n";
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

    private function scheduleReload(?string $canonicalUrl): void
    {
        $host = $this->host($canonicalUrl);
        $command = 'sleep 1; frankenphp reload --config /etc/frankenphp/Caddyfile --adapter caddyfile';
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $command .= ' && curl --insecure --silent --show-error --max-time 15 https://127.0.0.1:8443/up >/dev/null';
        }

        $process = new Process([
            '/bin/sh',
            '-c',
            "({$command}) >/dev/null 2>&1 &",
        ]);
        $process->setTimeout(5);
        $process->mustRun();
    }

    private function host(?string $canonicalUrl): string
    {
        $host = $canonicalUrl ? (string) parse_url($canonicalUrl, PHP_URL_HOST) : '';

        return strtolower(trim($host, '[]'));
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
