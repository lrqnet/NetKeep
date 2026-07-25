<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\GitProcessFactory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MigrateGitIdentityCommand extends Command
{
    protected $signature = 'netkeep:migrate-git-identity';

    protected $description = 'Migrates tracked device configuration paths to stable UUID identities';

    public function handle(GitProcessFactory $processes): int
    {
        $repository = rtrim((string) config('netkeep.oxidized.git_path'), '/');
        if (! is_dir($repository.'/.git')) {
            return self::SUCCESS;
        }

        $changed = 0;
        Device::withTrashed()
            ->with('group:id,name')
            ->orderBy('id')
            ->chunkById(250, function ($devices) use ($processes, $repository, &$changed): void {
                foreach ($devices as $device) {
                    $destination = ($device->device_group_id ? 'group-'.$device->device_group_id : 'default')
                        .'/'.$device->uuid;
                    if ($this->tracked($processes, $repository, $destination)) {
                        continue;
                    }
                    foreach ($this->legacyPaths($device->group?->name, $device->name, $device->device_group_id) as $legacy) {
                        if (! $this->tracked($processes, $repository, $legacy)) {
                            continue;
                        }
                        File::ensureDirectoryExists($repository.'/'.dirname($destination), 0770, true);
                        $this->git($processes, $repository, ['mv', '--', $legacy, $destination]);
                        $changed++;
                        break;
                    }
                }
            }, 'devices.id', 'id');

        if ($changed > 0) {
            $this->git($processes, $repository, ['commit', '-m', 'Migrate device identities to UUID']);
        }

        $this->info("Migrated Git identities: {$changed}.");

        return self::SUCCESS;
    }

    /** @return list<string> */
    private function legacyPaths(?string $group, string $name, ?int $groupId): array
    {
        if (! $this->safeSegment($name)) {
            return [];
        }
        $paths = [];
        if ($group !== null && $this->safeSegment($group)) {
            $paths[] = $group.'/'.$name;
        }
        if ($groupId !== null) {
            $paths[] = 'group-'.$groupId.'/'.$name;
        }
        $paths[] = 'default/'.$name;

        return array_values(array_unique($paths));
    }

    private function safeSegment(string $value): bool
    {
        return $value !== ''
            && ! in_array($value, ['.', '..'], true)
            && ! str_contains($value, '/')
            && ! str_contains($value, '\\')
            && ! str_contains($value, "\0");
    }

    private function tracked(GitProcessFactory $processes, string $repository, string $path): bool
    {
        $process = $processes->make(
            $repository,
            ['ls-files', '--error-unmatch', '--', $path],
        );
        $process->setTimeout(10);

        return $process->run() === 0;
    }

    /** @param list<string> $arguments */
    private function git(GitProcessFactory $processes, string $repository, array $arguments): void
    {
        $process = $processes->make($repository, $arguments);
        $process->setTimeout(60);
        $process->mustRun();
    }
}
