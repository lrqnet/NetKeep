<?php

namespace App\Services;

use Symfony\Component\Process\Process;

class GitProcessFactory
{
    /**
     * @param  list<string>  $arguments
     */
    public function make(string $repository, array $arguments): Process
    {
        $repository = rtrim($repository, '/');

        return new Process([
            'git',
            '-c',
            "safe.directory={$repository}",
            '-C',
            $repository,
            ...$arguments,
        ]);
    }
}
