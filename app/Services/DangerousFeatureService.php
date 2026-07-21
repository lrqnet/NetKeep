<?php

namespace App\Services;

use App\Enums\DangerousFeature;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DangerousFeatureService
{
    /** @var array<string, mixed>|null */
    private ?array $settings = null;

    public function enabled(DangerousFeature $feature): bool
    {
        $this->settings ??= Organization::query()->value('settings') ?? [];

        return (bool) data_get($this->settings, "dangerous_features.{$feature->value}.enabled", false);
    }

    public function set(DangerousFeature $feature, bool $enabled, User $owner): Organization
    {
        if (! $owner->role->canManageOwnership()) {
            throw new AuthorizationException;
        }

        $organization = DB::transaction(function () use ($feature, $enabled, $owner): Organization {
            $organization = Organization::query()->lockForUpdate()->firstOrFail();
            $settings = $organization->settings ?? [];
            data_set($settings, "dangerous_features.{$feature->value}", [
                'enabled' => $enabled,
                'accepted_by' => $enabled ? $owner->id : null,
                'accepted_at' => $enabled ? now()->toIso8601String() : null,
            ]);
            $organization->update(['settings' => $settings]);

            return $organization;
        });
        $this->settings = null;

        return $organization;
    }

    public function disableAll(): void
    {
        DB::transaction(function (): void {
            $organization = Organization::query()->lockForUpdate()->first();
            if (! $organization) {
                return;
            }

            $settings = $organization->settings ?? [];
            $settings['dangerous_features'] = [];
            $organization->update(['settings' => $settings]);
        });
        $this->settings = null;
    }
}
