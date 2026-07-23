<?php

namespace App\Services;

use App\Models\Device;

class OxidizedNodePresenter
{
    /**
     * @return array<string, int|string>
     */
    public function present(Device $device): array
    {
        $credentials = $device->credentials;
        $model = $device->customModel?->status === 'published'
            ? $device->customModel->slug
            : $device->oxidized_model;
        $approvedAddress = collect($device->approved_resolved_addresses)
            ->first(fn (string $address): bool => filter_var($address, FILTER_VALIDATE_IP) !== false);

        $removeSecrets = $device->remove_secrets ?? $device->group->remove_secrets ?? false;

        return array_filter([
            'name' => $device->uuid,
            'ip' => $approvedAddress ?: $device->ip_address ?: $device->hostname,
            'model' => $model,
            'group' => $device->device_group_id ? 'group-'.$device->device_group_id : 'default',
            'username' => $device->username_override ?: $credentials?->username,
            'password' => $device->password_override ?: $credentials?->password,
            'enable' => $device->enable_secret_override ?: $credentials?->enable_secret,
            'input' => $device->transport,
            'ssh_port' => $device->port,
            'telnet_port' => $device->port,
            'timeout' => $device->timeout,
            'remove_secret' => $removeSecrets ? 'true' : 'false',
            'ssh_keys' => filled($credentials?->private_key)
                ? '/home/oxidized/.config/oxidized/.ssh/profile-'.$credentials->id
                : null,
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
    }
}
