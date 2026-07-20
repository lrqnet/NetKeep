<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class GuidedModelPolicy
{
    /** @param array<string, mixed> $definition */
    public function validate(string $baseModel, array $definition): void
    {
        $reviewed = config('oxidized-security.reviewed_drivers', []);
        if (! in_array($baseModel, $reviewed, true)) {
            throw ValidationException::withMessages([
                'base_model' => __('netkeep.models.driver_not_reviewed'),
            ]);
        }

        $allowedCommands = config("oxidized-security.safe_commands.{$baseModel}", []);
        $commands = array_values(array_filter((array) ($definition['commands'] ?? [])));
        if ($commands === []) {
            throw ValidationException::withMessages([
                'definition.commands' => __('netkeep.models.safe_command_required'),
            ]);
        }

        foreach ($commands as $command) {
            if (! is_string($command) || ! in_array(trim($command), $allowedCommands, true)) {
                throw ValidationException::withMessages([
                    'definition.commands' => __('netkeep.models.command_not_allowed'),
                ]);
            }
            $this->assertConstant($command, 'definition.commands');
        }

        $postLogin = trim((string) ($definition['post_login'] ?? ''));
        if (! in_array($postLogin, config('oxidized-security.session_commands', []), true)) {
            throw ValidationException::withMessages([
                'definition.post_login' => __('netkeep.models.session_command_not_allowed'),
            ]);
        }

        $logout = trim((string) ($definition['logout'] ?? ''));
        if (! in_array($logout, config('oxidized-security.logout_commands', []), true)) {
            throw ValidationException::withMessages([
                'definition.logout' => __('netkeep.models.logout_command_not_allowed'),
            ]);
        }

        $this->assertSafeExpression(
            (string) ($definition['prompt'] ?? ''),
            'definition.prompt',
        );

        foreach ((array) ($definition['filters'] ?? []) as $filter) {
            if (
                ! is_string($filter)
                || strlen($filter) > 255
            ) {
                throw ValidationException::withMessages([
                    'definition.filters' => __('netkeep.models.filter_not_allowed'),
                ]);
            }
            $this->assertSafeExpression($filter, 'definition.filters');
        }
    }

    private function assertSafeExpression(string $value, string $field): void
    {
        if (
            strlen($value) > 255
            || str_contains($value, "\0")
            || preg_match('/\(\?[=!<]/', $value)
            || preg_match('/\\\\[1-9]/', $value)
            || preg_match('/\([^)]*[+*][^)]*\)[+*{]/', $value)
        ) {
            throw ValidationException::withMessages([
                $field => __('netkeep.models.filter_not_allowed'),
            ]);
        }
    }

    private function assertConstant(string $value, string $field): void
    {
        if (
            preg_match('/[\r\n;|&`]/', $value)
            || str_contains($value, '$(')
            || preg_match('/\b(configure|reload|reboot|write|copy|delete|erase|commit|install|upgrade|request\s+system|shutdown|format)\b/i', $value)
        ) {
            throw ValidationException::withMessages([
                $field => __('netkeep.models.command_not_allowed'),
            ]);
        }
    }
}
