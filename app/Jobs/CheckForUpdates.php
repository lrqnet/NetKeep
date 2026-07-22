<?php

namespace App\Jobs;

use App\Services\ReleaseDiscoveryService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckForUpdates implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $uniqueFor = 300;

    public function __construct(public bool $force = false) {}

    public function handle(ReleaseDiscoveryService $releases): void
    {
        $releases->check($this->force);
    }
}
