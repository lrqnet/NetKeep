<?php

namespace App\Services;

use App\Models\CredentialProfile;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class OxidizedCredentialMaterializer
{
    public function sync(CredentialProfile $profile): void
    {
        $directory = rtrim((string) config('netkeep.oxidized.config_path'), '/').'/.ssh';
        File::ensureDirectoryExists($directory, 0700, true);
        $target = $directory.'/profile-'.$profile->id;

        if (! filled($profile->private_key)) {
            File::delete($target);

            return;
        }

        $temporary = $target.'.tmp-'.bin2hex(random_bytes(4));
        File::put($temporary, rtrim((string) $profile->private_key)."\n");
        chmod($temporary, 0600);

        if (filled($profile->private_key_passphrase)) {
            $process = new Process([
                'ssh-keygen', '-p', '-q',
                '-P', (string) $profile->private_key_passphrase,
                '-N', '',
                '-f', $temporary,
            ]);
            $process->setTimeout(15);
            $process->mustRun();
        }

        if (! rename($temporary, $target)) {
            @unlink($temporary);
            throw new \RuntimeException('Não foi possível materializar a chave SSH.');
        }

        @chown($target, 30000);
        @chgrp($target, 30000);
        chmod($target, 0600);
    }

    public function delete(CredentialProfile $profile): void
    {
        File::delete(rtrim((string) config('netkeep.oxidized.config_path'), '/').'/.ssh/profile-'.$profile->id);
    }
}
