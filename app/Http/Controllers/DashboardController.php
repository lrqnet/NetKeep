<?php

namespace App\Http\Controllers;

use App\Enums\DeviceStatus;
use App\Models\BackupRun;
use App\Models\Device;
use App\Services\OxidizedClient;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(OxidizedClient $oxidized): Response
    {
        $overdue = Device::query()
            ->where('enabled', true)
            ->get(['last_backup_at', 'backup_interval'])
            ->filter(fn (Device $device): bool => ! $device->last_backup_at
                || $device->last_backup_at->addSeconds($device->backup_interval)->isPast())
            ->count();

        return Inertia::render('dashboard', [
            'stats' => [
                'total' => Device::query()->where('enabled', true)->count(),
                'healthy' => Device::query()->where('status', DeviceStatus::Healthy)->count(),
                'failing' => Device::query()->where('status', DeviceStatus::Failing)->count(),
                'overdue' => $overdue,
            ],
            'engine' => $oxidized->health(),
            'recentDevices' => Device::query()
                ->with(['group:id,name', 'site:id,name'])
                ->latest('updated_at')
                ->limit(8)
                ->get(['id', 'name', 'ip_address', 'status', 'last_backup_at', 'device_group_id', 'site_id']),
            'recentChanges' => BackupRun::query()
                ->with('device:id,name')
                ->where('changed', true)
                ->latest('finished_at')
                ->limit(8)
                ->get(),
        ]);
    }
}
