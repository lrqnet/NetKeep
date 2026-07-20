<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class InstallationClaimService
{
    public function validate(string $candidate): void
    {
        $expected = $this->token();
        if ($expected === '' || ! hash_equals($expected, trim($candidate))) {
            throw ValidationException::withMessages([
                'installation_token' => __('netkeep.setup.invalid_installation_token'),
            ]);
        }
    }

    public function invalidate(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $path = (string) config('netkeep.installation_claim_path');
        if (is_file($path)) {
            if (file_put_contents($path, "invalidated\n", LOCK_EX) === false) {
                throw new \RuntimeException('installation_token_invalidation_failed');
            }
        }
    }

    public function token(): string
    {
        if (app()->environment('testing')) {
            return (string) config('netkeep.installation_claim_test_token', 'netkeep-test-claim-token');
        }

        $path = (string) config('netkeep.installation_claim_path');

        $stored = is_readable($path) ? trim((string) file_get_contents($path)) : '';
        if ($stored === 'invalidated') {
            return '';
        }
        $recovery = str_starts_with($stored, 'recovery:');
        $initial = str_starts_with($stored, 'initial:');
        $token = ($recovery || $initial) ? substr($stored, strpos($stored, ':') + 1) : $stored;
        if (! $recovery && Schema::hasTable('users') && User::query()->exists()) {
            return '';
        }

        return $token;
    }

    public function rotate(): string
    {
        $path = (string) config('netkeep.installation_claim_path');
        $token = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        if (! is_file($path) || file_put_contents($path, "recovery:{$token}\n", LOCK_EX) === false) {
            throw new \RuntimeException('installation_token_rotation_failed');
        }

        return $token;
    }
}
