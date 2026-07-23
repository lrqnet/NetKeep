<?php

namespace App\Services;

use App\Enums\DeviceApprovalStatus;
use App\Models\Device;
use Illuminate\Support\Facades\File;

class KnownHostsWriter
{
    public function write(?string $configPath = null): void
    {
        $directory = rtrim($configPath ?? (string) config('netkeep.oxidized.config_path'), '/').'/.ssh';
        File::ensureDirectoryExists($directory, 0700);
        $target = $directory.'/known_hosts';
        $temporary = $target.'.'.bin2hex(random_bytes(8)).'.tmp';
        $content = Device::query()
            ->where('enabled', true)
            ->where('approval_status', DeviceApprovalStatus::Approved)
            ->where('transport', 'ssh')
            ->whereNotNull('ssh_host_key')
            ->orderBy('uuid')
            ->get()
            ->flatMap(function (Device $device): array {
                $hosts = collect([
                    $device->hostname ?: $device->ip_address,
                    ...($device->approved_resolved_addresses ?? []),
                ])->filter(fn (string $host): bool => $host !== '')
                    ->unique()
                    ->values();

                return $hosts->flatMap(function (string $host) use ($device): array {
                    $prefix = $device->port === 22 ? $host : "[{$host}]:{$device->port}";

                    return collect(explode("\n", (string) $device->ssh_host_key))
                        ->map(function (string $key) use ($prefix): string {
                            $parts = preg_split('/\s+/', trim($key), 3);

                            return is_array($parts) && count($parts) >= 3
                                ? $prefix.' '.$parts[1].' '.$parts[2]
                                : '';
                        })
                        ->filter()
                        ->all();
                })->all();
            })
            ->implode("\n");

        File::put($temporary, $content === '' ? '' : $content."\n", true);
        chmod($temporary, 0640);
        rename($temporary, $target);
    }
}
