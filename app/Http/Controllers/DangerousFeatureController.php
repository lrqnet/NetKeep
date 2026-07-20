<?php

namespace App\Http\Controllers;

use App\Enums\DangerousFeature;
use App\Services\AuditLogger;
use App\Services\DangerousFeatureService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DangerousFeatureController extends Controller
{
    public function update(
        Request $request,
        DangerousFeature $feature,
        DangerousFeatureService $dangerous,
        AuditLogger $audit,
    ): RedirectResponse {
        abort_unless($request->user()->role->canManageOwnership(), 403);
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'confirmation' => [
                Rule::requiredIf($request->boolean('enabled')),
                'nullable',
                Rule::in(["ENABLE {$feature->value}"]),
            ],
        ]);
        if ($data['enabled']) {
            abort_unless(
                (int) $request->session()->get('auth.password_confirmed_at', 0) >= now()->subMinutes(5)->timestamp,
                423,
            );
        }

        $organization = $dangerous->set($feature, (bool) $data['enabled'], $request->user());
        $audit->record('security.dangerous_feature_changed', $organization, [
            'feature' => $feature->value,
            'enabled' => (bool) $data['enabled'],
        ]);

        return back()->with(
            $data['enabled'] ? 'warning' : 'success',
            $data['enabled']
                ? __('netkeep.security.dangerous_feature_enabled')
                : __('netkeep.security.dangerous_feature_disabled'),
        );
    }
}
