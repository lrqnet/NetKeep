<?php

namespace App\Jobs;

use App\Services\UpdateService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class TriggerUpdate implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $containerId) {}

    public function handle(UpdateService $updates): void
    {
        SendAlert::dispatch('update', 'netkeep.alerts.update_started', ['container_id' => $this->containerId]);
        $updates->trigger($this->containerId);
    }
}
