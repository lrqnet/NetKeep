<?php

namespace App\Services;

use RuntimeException;
use Symfony\Component\Process\Process;

class BackupDecryptor
{
    public function __construct(private readonly BackupCrypto $crypto) {}

    public function stream(
        string $archive,
        ?string $password,
        ?string $identity,
        \Closure $consumer,
    ): void {
        if ($identity === null) {
            if ($password === null) {
                throw new RuntimeException('restore_recovery_material_required');
            }
            $this->crypto->decryptStream($archive, $password, $consumer);

            return;
        }

        $identityPath = realpath($identity);
        if ($identityPath === false || ! is_file($identityPath)) {
            throw new RuntimeException('restore_identity_invalid');
        }
        $process = new Process(['age', '--decrypt', '--identity', $identityPath, $archive]);
        $process->setTimeout(7200);
        $process->disableOutput();
        $process->run(function (string $type, string $data) use ($consumer): void {
            if ($type === Process::OUT) {
                $offset = 0;
                while ($offset < strlen($data)) {
                    $chunk = substr($data, $offset, 65536);
                    $consumer($chunk);
                    $offset += strlen($chunk);
                }
            }
        });
        if (! $process->isSuccessful()) {
            throw new RuntimeException('restore_age_decryption_failed');
        }
    }
}
