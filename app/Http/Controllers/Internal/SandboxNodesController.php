<?php

namespace App\Http\Controllers\Internal;

use App\Enums\DangerousFeature;
use App\Enums\DeviceApprovalStatus;
use App\Http\Controllers\Controller;
use App\Models\CustomModel;
use App\Models\Device;
use App\Services\DangerousFeatureService;
use App\Services\DeviceApprovalService;
use App\Services\DeviceSafetyPolicy;
use App\Services\OxidizedNodePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SandboxNodesController extends Controller
{
    public function __invoke(
        OxidizedNodePresenter $presenter,
        DeviceApprovalService $approval,
        DangerousFeatureService $dangerous,
        DeviceSafetyPolicy $safety,
    ): JsonResponse {
        $selection = Cache::get('netkeep:sandbox-selection');
        $device = is_array($selection)
            ? Device::query()
                ->whereKey((int) ($selection['device_id'] ?? 0))
                ->where('enabled', true)
                ->where('approval_status', DeviceApprovalStatus::Approved)
                ->with(['credentials', 'group', 'customModel'])
                ->first()
            : null;
        if ($device) {
            $diagnostic = ($selection['mode'] ?? null) === 'diagnostic';
            $model = $diagnostic ? null : CustomModel::query()
                ->where('slug', (string) ($selection['model_slug'] ?? ''))
                ->first();
            if (
                (! $diagnostic && ! $model)
                || ! $approval->isCurrent($device)
                || ($diagnostic && ! $safety->allows($device))
                || (
                    $device->transport === 'telnet'
                    && ! $dangerous->enabled(DangerousFeature::Telnet)
                )
                || (
                    $model?->source === 'raw'
                    && ! $dangerous->enabled(DangerousFeature::RawRuby)
                )
            ) {
                $device = null;
            }
        }

        $nodes = $device
            ? [[...$presenter->present($device), 'model' => (string) $selection['model_slug']]]
            : [[
                'name' => '__netkeep_sandbox_bootstrap__',
                'ip' => '192.0.2.2',
                'model' => 'ios',
                'group' => '__netkeep_internal__',
                'username' => 'disabled',
                'password' => 'disabled',
                'input' => 'ssh',
                'ssh_port' => 22,
                'timeout' => 1,
                'remove_secret' => 'true',
            ]];

        return response()->json($nodes)
            ->header('Cache-Control', 'no-store, private')
            ->header('X-Content-Type-Options', 'nosniff');
    }
}
