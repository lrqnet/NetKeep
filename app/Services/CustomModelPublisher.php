<?php

namespace App\Services;

use App\Models\CustomModel;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class CustomModelPublisher
{
    public function validate(CustomModel $model): ?string
    {
        $process = new Process(['ruby', '-c']);
        $process->setInput($model->ruby_source);
        $process->setTimeout(10);
        $process->run();

        return $process->isSuccessful() ? null : trim($process->getErrorOutput() ?: $process->getOutput());
    }

    public function publish(CustomModel $model): ?string
    {
        return $this->publishTo($model, (string) config('netkeep.oxidized.config_path'));
    }

    public function publishTo(CustomModel $model, string $configPath): ?string
    {
        $modelDir = rtrim($configPath, '/').'/model';
        File::ensureDirectoryExists($modelDir, 0750, true);

        $target = $modelDir.'/'.$model->slug.'.rb';
        $previous = File::exists($target) ? File::get($target) : null;
        $temporary = $target.'.tmp-'.bin2hex(random_bytes(4));
        File::put($temporary, $model->ruby_source);
        chmod($temporary, 0640);

        if (! rename($temporary, $target)) {
            @unlink($temporary);
            throw new \RuntimeException('Não foi possível publicar o modelo atomicamente.');
        }

        return $previous;
    }

    public function rollback(CustomModel $model, ?string $previous): void
    {
        $this->rollbackFrom($model, $previous, (string) config('netkeep.oxidized.config_path'));
    }

    public function rollbackFrom(CustomModel $model, ?string $previous, string $configPath): void
    {
        $target = rtrim($configPath, '/').'/model/'.$model->slug.'.rb';

        if ($previous === null) {
            File::delete($target);

            return;
        }

        $temporary = $target.'.rollback-'.bin2hex(random_bytes(4));
        File::put($temporary, $previous);
        chmod($temporary, 0640);
        rename($temporary, $target);
    }
}
