<?php

namespace App\Services;

use App\Enums\BackupDestinationRunStatus;
use App\Models\BackupDestination;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class GitMirrorService
{
    public function __construct(
        private readonly OutboundUrlGuard $urls,
        private readonly GitProcessFactory $processes,
    ) {}

    public function mirror(BackupDestination $destination): void
    {
        if ($destination->type !== 'git') {
            throw new \InvalidArgumentException('git_destination_invalid');
        }
        $destination->markRunStatus(BackupDestinationRunStatus::Running);

        try {
            $repository = (string) config('netkeep.oxidized.git_path');
            if (! is_dir($repository.'/.git')) {
                throw new \RuntimeException('git_repository_unavailable');
            }
            $config = $destination->config;
            $target = $this->validatedTarget((string) ($config['url'] ?? ''));
            $environment = ['GIT_TERMINAL_PROMPT' => '0'];
            $temporaryDirectory = null;
            if (($config['auth_type'] ?? 'token') === 'ssh') {
                $temporaryDirectory = '/tmp/netkeep-git-'.Str::uuid();
                File::ensureDirectoryExists($temporaryDirectory, 0700, true);
                $key = $temporaryDirectory.'/identity';
                File::put($key, (string) ($config['private_key'] ?? ''));
                chmod($key, 0600);
                $knownHosts = $this->knownHosts($destination, $target);
                $environment['GIT_SSH_COMMAND'] = 'ssh -i '.escapeshellarg($key)
                    .' -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile='
                    .escapeshellarg($knownHosts).' -o HostKeyAlias='.escapeshellarg($target['host']);
            } else {
                $token = (string) ($config['token'] ?? '');
                if ($token === '') {
                    throw new \RuntimeException('git_token_missing');
                }
                $environment['GIT_CONFIG_COUNT'] = '2';
                $environment['GIT_CONFIG_KEY_0'] = 'http.extraHeader';
                $environment['GIT_CONFIG_VALUE_0'] = 'Authorization: Basic '.base64_encode('oauth2:'.$token);
                $environment['GIT_CONFIG_KEY_1'] = 'http.curloptResolve';
                $environment['GIT_CONFIG_VALUE_1'] = "{$target['host']}:{$target['port']}:{$target['address']}";
            }

            $process = $this->processes->make(
                $repository,
                ['push', '--mirror', $target['url']],
            );
            $process->setEnv($environment);
            $process->setTimeout(1800);
            $process->mustRun();
            $destination->markRunStatus(BackupDestinationRunStatus::Completed);
        } catch (\Throwable $exception) {
            $destination->markRunStatus(BackupDestinationRunStatus::Failed);
            throw $exception;
        } finally {
            if (isset($temporaryDirectory)) {
                File::deleteDirectory($temporaryDirectory);
            }
        }
    }

    /** @return array{url:string,host:string,port:int,address:string} */
    private function validatedTarget(string $url): array
    {
        if (preg_match('/^git@([A-Za-z0-9.-]+):([A-Za-z0-9._\/-]+\.git)$/', $url, $matches)) {
            $resolved = $this->urls->resolveUrl('https://'.$matches[1]);
            $address = $resolved['addresses'][0];
            $hostValue = str_contains($address, ':') ? "[{$address}]" : $address;

            return [
                'url' => "ssh://git@{$hostValue}/{$matches[2]}",
                'host' => $resolved['host'],
                'port' => 22,
                'address' => $address,
            ];
        }
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            $scheme = (string) parse_url($url, PHP_URL_SCHEME);
            $user = (string) (parse_url($url, PHP_URL_USER) ?? '');
            if (
                in_array($scheme, ['https', 'ssh'], true)
                && ! parse_url($url, PHP_URL_PASS)
                && ($scheme === 'https' ? $user === '' : preg_match('/^[A-Za-z0-9._-]*$/', $user))
            ) {
                $host = (string) parse_url($url, PHP_URL_HOST);
                $port = (int) (parse_url($url, PHP_URL_PORT) ?? ($scheme === 'ssh' ? 22 : 443));
                $resolved = $this->urls->resolveUrl('https://'.$host.($port === 443 ? '' : ':'.$port));
                $address = $resolved['addresses'][0];
                if ($scheme === 'ssh') {
                    $hostValue = str_contains($address, ':') ? "[{$address}]" : $address;
                    $path = (string) parse_url($url, PHP_URL_PATH);
                    $url = 'ssh://'.($user === '' ? 'git' : $user)."@{$hostValue}:{$port}{$path}";
                }

                return compact('url', 'host', 'port', 'address');
            }
        }

        throw new \InvalidArgumentException('git_url_invalid');
    }

    /** @param array{url:string,host:string,port:int,address:string} $target */
    private function knownHosts(BackupDestination $destination, array $target): string
    {
        $directory = rtrim((string) config('netkeep.backup_path'), '/').'/.git-known-hosts';
        File::ensureDirectoryExists($directory, 0700, true);
        $path = $directory.'/'.$destination->id;
        if (is_file($path) && filesize($path) > 0) {
            return $path;
        }

        $scan = new Process([
            'ssh-keyscan',
            '-T',
            '10',
            '-p',
            (string) $target['port'],
            (string) $target['address'],
        ]);
        $scan->setTimeout(20);
        $scan->mustRun();
        $alias = $target['port'] === 22
            ? $target['host']
            : "[{$target['host']}]:{$target['port']}";
        $keys = collect(preg_split('/\r?\n/', trim($scan->getOutput())) ?: [])
            ->map(function (string $line) use ($alias): ?string {
                $parts = preg_split('/\s+/', trim($line), 3);

                return is_array($parts) && count($parts) === 3
                    ? "{$alias} {$parts[1]} {$parts[2]}"
                    : null;
            })
            ->filter()
            ->implode("\n");
        if ($keys === '') {
            throw new \RuntimeException('git_host_key_unavailable');
        }
        $temporary = $path.'.partial';
        File::put($temporary, $keys."\n", true);
        chmod($temporary, 0600);
        rename($temporary, $path);

        return $path;
    }
}
