<?php

namespace App\Exceptions;

use RuntimeException;

class GitRepositoryUnavailable extends RuntimeException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('git_repository_unavailable', previous: $previous);
    }
}
