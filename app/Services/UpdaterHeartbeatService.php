<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class UpdaterHeartbeatService
{
    /** @return array{online:bool,checked_at:?string} */
    public function status(): array
    {
        $path = $this->exchange->path().'/heartbeat.json';
        if (! is_file($path) || filesize($path) === false || filesize($path) > 4096) {
            return ['online' => false, 'checked_at' => null];
        }
        $payload = json_decode(File::get($path), true);
        $checkedAt = is_array($payload) && is_string($payload['checked_at'] ?? null)
            ? $payload['checked_at']
            : null;
        $timestamp = $checkedAt ? strtotime($checkedAt) : false;

        return [
            'online' => $timestamp !== false && $timestamp >= now()->subMinutes(2)->getTimestamp(),
            'checked_at' => $checkedAt,
        ];
    }

    public function __construct(private readonly UpdateExchangeService $exchange) {}
}
