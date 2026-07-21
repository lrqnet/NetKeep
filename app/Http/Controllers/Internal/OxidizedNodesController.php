<?php

namespace App\Http\Controllers\Internal;

use App\Enums\DeviceApprovalStatus;
use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\DeviceApprovalService;
use App\Services\DeviceSafetyPolicy;
use App\Services\OxidizedNodePresenter;
use Illuminate\Http\JsonResponse;

class OxidizedNodesController extends Controller
{
    public function __invoke(
        OxidizedNodePresenter $presenter,
        DeviceApprovalService $approval,
        DeviceSafetyPolicy $safety,
    ): JsonResponse {
        $nodes = Device::query()
            ->where('enabled', true)
            ->where('approval_status', DeviceApprovalStatus::Approved)
            ->with(['credentials', 'group', 'customModel'])
            ->orderBy('uuid')
            ->get()
            ->filter(
                fn (Device $device): bool => $approval->isCurrent($device)
                    && $safety->allows($device),
            )
            ->map(fn (Device $device): array => $presenter->present($device))
            ->values();

        if ($nodes->isEmpty()) {
            $nodes->push([
                'name' => '__netkeep_bootstrap__',
                'ip' => '192.0.2.1',
                'model' => 'ios',
                'group' => '__netkeep_internal__',
                'username' => 'disabled',
                'password' => 'disabled',
                'input' => 'ssh',
                'ssh_port' => 22,
                'timeout' => 1,
                'remove_secret' => 'true',
            ]);
        }

        return response()->json($nodes)
            ->header('Cache-Control', 'no-store, private')
            ->header('X-Content-Type-Options', 'nosniff');
    }
}
