<?php

namespace App\Services;

use App\Enums\DeviceApprovalStatus;
use App\Enums\DeviceStatus;
use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeviceApprovalService
{
    private const SENSITIVE_FIELDS = [
        'hostname',
        'ip_address',
        'port',
        'transport',
        'credential_profile_id',
        'username_override',
        'password_override',
        'enable_secret_override',
        'oxidized_model',
        'custom_model_id',
    ];

    public function fingerprint(Device $device): string
    {
        return hash('sha256', json_encode([
            'hostname' => $device->hostname,
            'ip_address' => $device->ip_address,
            'port' => $device->port,
            'transport' => $device->transport,
            'credential_profile_id' => $device->credential_profile_id,
            'username_override' => $device->username_override,
            'password_override_set' => filled($device->password_override),
            'enable_secret_override_set' => filled($device->enable_secret_override),
            'oxidized_model' => $device->oxidized_model,
            'custom_model_id' => $device->custom_model_id,
        ], JSON_THROW_ON_ERROR));
    }

    public function isCurrent(Device $device): bool
    {
        return filled($device->approval_fingerprint)
            && hash_equals((string) $device->approval_fingerprint, $this->fingerprint($device));
    }

    /** @param array<string, mixed> $data */
    public function hasSensitiveChanges(Device $device, array $data): bool
    {
        foreach (self::SENSITIVE_FIELDS as $field) {
            if (array_key_exists($field, $data) && $device->getAttribute($field) != $data[$field]) {
                return true;
            }
        }

        return false;
    }

    public function invalidate(Device $device, DeviceApprovalStatus $status = DeviceApprovalStatus::Pending): void
    {
        $device->forceFill([
            'enabled' => false,
            'status' => DeviceStatus::Pending,
            'approval_status' => $status,
            'approval_fingerprint' => null,
            'approved_by' => null,
            'approved_at' => null,
            'approved_resolved_addresses' => null,
            'next_collection_at' => null,
        ])->save();
    }

    /** @param list<string> $resolvedAddresses */
    public function approve(Device $device, User $user, array $resolvedAddresses, ?string $hostKey, ?string $hostKeyFingerprint): Device
    {
        return DB::transaction(function () use ($device, $user, $resolvedAddresses, $hostKey, $hostKeyFingerprint): Device {
            $locked = Device::query()->lockForUpdate()->findOrFail($device->id);
            $locked->forceFill([
                'enabled' => true,
                'status' => DeviceStatus::Pending,
                'approval_status' => DeviceApprovalStatus::Approved,
                'approval_fingerprint' => $this->fingerprint($locked),
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approved_resolved_addresses' => $resolvedAddresses,
                'ssh_host_key' => $hostKey,
                'ssh_host_key_fingerprint' => $hostKeyFingerprint,
                'next_collection_at' => now()->addSeconds(random_int(0, max(1, (int) floor($locked->backup_interval * 0.1)))),
                'consecutive_failures' => 0,
            ])->save();

            return $locked->refresh();
        });
    }
}
