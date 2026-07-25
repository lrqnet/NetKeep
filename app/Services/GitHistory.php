<?php

namespace App\Services;

use App\Exceptions\GitRepositoryUnavailable;
use App\Models\Device;

class GitHistory
{
    public function __construct(private readonly GitProcessFactory $processes) {}

    /**
     * @return array<int, array{hash:string,date:string,author:string,subject:string}>
     */
    public function versions(Device $device, int $limit = 50): array
    {
        if (! is_dir(rtrim((string) config('netkeep.oxidized.git_path'), '/').'/.git')) {
            throw new GitRepositoryUnavailable;
        }

        $path = $this->devicePath($device);
        try {
            $output = $this->run([
                'log',
                '--follow',
                '--format=%H%x09%cI%x09%an%x09%s',
                '-n',
                (string) $limit,
                '--',
                $path,
            ]);
        } catch (\Throwable $exception) {
            throw new GitRepositoryUnavailable($exception);
        }

        return collect(explode("\n", trim($output)))
            ->filter()
            ->map(function (string $line): array {
                [$hash, $date, $author, $subject] = array_pad(explode("\t", $line, 4), 4, '');

                return compact('hash', 'date', 'author', 'subject');
            })->values()->all();
    }

    public function content(Device $device, string $revision = 'HEAD'): string
    {
        $this->assertRevision($revision);

        try {
            return $this->run(['show', $revision.':'.$this->devicePath($device)]);
        } catch (\Throwable $exception) {
            throw new GitRepositoryUnavailable($exception);
        }
    }

    public function diff(Device $device, string $from, string $to): string
    {
        $this->assertRevision($from);
        $this->assertRevision($to);

        try {
            return $this->run(['diff', '--no-color', $from, $to, '--', $this->devicePath($device)]);
        } catch (\Throwable $exception) {
            throw new GitRepositoryUnavailable($exception);
        }
    }

    private function devicePath(Device $device): string
    {
        $group = $device->device_group_id ? 'group-'.$device->device_group_id : 'default';

        return $group.'/'.$device->uuid;
    }

    /**
     * @param  list<string>  $arguments
     */
    private function run(array $arguments): string
    {
        $process = $this->processes->make(
            (string) config('netkeep.oxidized.git_path'),
            $arguments,
        );
        $process->setTimeout(15);
        $process->mustRun();

        return $process->getOutput();
    }

    private function assertRevision(string $revision): void
    {
        if (! preg_match('/^(HEAD|[a-f0-9]{7,40})$/', $revision)) {
            throw new \InvalidArgumentException('Revisão Git inválida.');
        }
    }
}
