<?php

namespace App\Services;

class CollectionErrorClassifier
{
    public function classify(?string $type, ?string $reason): string
    {
        $error = strtolower(trim(($type ?? '').' '.($reason ?? '')));

        return match (true) {
            preg_match('/auth|permission denied|login failed|invalid (?:user|credential)/', $error) === 1 => 'authentication_failed',
            str_contains($error, 'connection refused') => 'connection_refused',
            str_contains($error, 'timelimit')
                || str_contains($error, 'time limit')
                || str_contains($error, 'collection_timeout') => 'collection_timelimit',
            str_contains($error, 'timeout') || str_contains($error, 'timed out') => 'connection_timeout',
            str_contains($error, 'prompt') => 'prompt_not_detected',
            str_contains($error, 'host key') || str_contains($error, 'hostkey') => 'ssh_host_key_changed',
            preg_match('/driver|model|command|syntax|not implemented/', $error) === 1 => 'driver_error',
            default => 'engine_failure',
        };
    }
}
