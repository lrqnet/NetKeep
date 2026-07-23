<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\AuditLogger;
use App\Services\DeviceDiagnosticService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceDiagnosticController extends Controller
{
    public function __invoke(
        Device $device,
        Request $request,
        DeviceDiagnosticService $diagnostics,
        AuditLogger $audit,
    ): RedirectResponse {
        $request->validate([
            'risk_confirmation' => ['required', Rule::in(['DIAGNOSTIC'])],
        ]);
        $run = $diagnostics->request($device, $request->user());
        $audit->record('device.diagnostic_requested', $device, [
            'collection_run_uuid' => $run->uuid,
        ]);

        return back()->with('warning', __('netkeep.devices.diagnostic_queued'));
    }
}
