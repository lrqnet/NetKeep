<?php

namespace App\Console\Commands;

use App\Models\BackupDestination;
use App\Services\GitMirrorService;
use Illuminate\Console\Command;

class MirrorGitCommand extends Command
{
    protected $signature = 'netkeep:mirror-git';

    protected $description = 'Espelha o histórico em todos os destinos Git ativos';

    public function handle(GitMirrorService $mirror): int
    {
        $failed = false;
        BackupDestination::query()
            ->where('type', 'git')
            ->where('enabled', true)
            ->each(function (BackupDestination $destination) use ($mirror, &$failed): void {
                try {
                    $mirror->mirror($destination);
                    $this->info("Espelho {$destination->name} atualizado.");
                } catch (\Throwable $exception) {
                    $failed = true;
                    report($exception);
                    $this->error("Falha em {$destination->name}: {$exception->getMessage()}");
                }
            });

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
