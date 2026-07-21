<?php

namespace App\Services;

use App\Models\AuditEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(string $action, ?Model $subject = null, array $metadata = [], ?Request $request = null): AuditEvent
    {
        $request ??= request();

        return AuditEvent::query()->create([
            'user_id' => $request->user()?->getAuthIdentifier(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
            'metadata' => $this->sanitize($metadata),
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    private function sanitize(array $metadata): array
    {
        $secretFragments = ['password', 'secret', 'token', 'private_key', 'passphrase', 'enable'];

        foreach ($metadata as $key => $value) {
            $normalized = strtolower((string) $key);
            if (collect($secretFragments)->contains(
                fn (string $fragment): bool => str_contains($normalized, $fragment),
            )) {
                $metadata[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $metadata[$key] = $this->sanitize($value);
            }
        }

        return $metadata;
    }
}
