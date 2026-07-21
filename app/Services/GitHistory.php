<?php

namespace App\Services;

use App\Models\Device;
use Symfony\Component\Process\Process;

class GitHistory
{
    /**
     * @return array<int, array{hash:string,date:string,author:string,subject:string}>
     */
    public function versions(Device $device, int $limit = 50): array
    {
        if (! is_dir(rtrim((string) config('netkeep.oxidized.git_path'), '/').'/.git')) {
            return [];
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
        } catch (\Throwable) {
            return [];
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
        } catch (\Throwable) {
            return '';
        }
    }

    public function diff(Device $device, string $from, string $to): string
    {
        $this->assertRevision($from);
        $this->assertRevision($to);

        return $this->run(['diff', '--no-color', $from, $to, '--', $this->devicePath($device)]);
    }

    private function devicePath(Device $device): string
    {
        $group = $device->device_group_id ? 'group-'.$device->device_group_id : 'default';

        return $group.'/'.$device->uuid;
    }

    /**
     * @param  array<int, string>  $arguments
     */
    private function run(array $arguments): string
    {
        $process = new Process(['git', '-C', (string) config('netkeep.oxidized.git_path'), ...$arguments]);
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
