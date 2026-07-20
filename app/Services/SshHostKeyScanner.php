<?php

namespace App\Services;

use Symfony\Component\Process\Process;

class SshHostKeyScanner
{
    /** @return array{keys:string,fingerprint:string} */
    public function scan(string $target, int $port): array
    {
        $process = new Process(['ssh-keyscan', '-T', '8', '-p', (string) $port, $target]);
        $process->setTimeout(12);
        $process->run();
        $keys = collect(explode("\n", $process->getOutput()))
            ->map(fn (string $line): string => trim($line))
            ->filter(fn (string $line): bool => $line !== '' && ! str_starts_with($line, '#'))
            ->unique()
            ->sort()
            ->values();

        if ($keys->isEmpty()) {
            throw new \RuntimeException('ssh_host_key_unavailable');
        }

        $fingerprints = $keys->map(function (string $key): string {
            $process = new Process(['ssh-keygen', '-lf', '-', '-E', 'sha256']);
            $process->setInput($key."\n");
            $process->setTimeout(5);
            $process->mustRun();
            $parts = preg_split('/\s+/', trim($process->getOutput()));

            return (string) ($parts[1] ?? '');
        })->filter()->unique()->sort()->values();

        if ($fingerprints->isEmpty()) {
            throw new \RuntimeException('ssh_host_key_invalid');
        }

        return [
            'keys' => $keys->implode("\n"),
            'fingerprint' => $fingerprints->implode(', '),
        ];
    }
}
