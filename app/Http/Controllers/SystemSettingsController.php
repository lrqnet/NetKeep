<?php

namespace App\Http\Controllers;

use App\Enums\DangerousFeature;
use App\Enums\DeviceApprovalStatus;
use App\Enums\SupportedLocale;
use App\Models\Device;
use App\Models\Organization;
use App\Services\AuditLogger;
use App\Services\CaddyTlsConfigService;
use App\Services\CanonicalUrlService;
use App\Services\OxidizedEngineConfigService;
use App\Services\SessionRevoker;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Passkeys\Passkeys;

class SystemSettingsController extends Controller
{
    public function index(): Response
    {
        $organization = Organization::query()->firstOrFail();
        $settings = $organization->settings ?? [];
        $approvedDevices = Device::query()
            ->where('enabled', true)
            ->where('approval_status', DeviceApprovalStatus::Approved);
        $deviceCount = (clone $approvedDevices)->count();
        $shortestInterval = (clone $approvedDevices)->min('backup_interval');

        return Inertia::render('system/index', [
            'organization' => $organization,
            'timezones' => DateTimeZone::listIdentifiers(),
            'collectionCapacity' => [
                'deviceCount' => $deviceCount,
                'shortestInterval' => is_numeric($shortestInterval) ? (int) $shortestInterval : null,
            ],
            'dangerousFeatures' => collect(DangerousFeature::cases())->mapWithKeys(
                fn (DangerousFeature $feature): array => [
                    $feature->value => (bool) data_get($settings, "dangerous_features.{$feature->value}.enabled", false),
                ],
            ),
        ]);
    }

    public function update(
        Request $request,
        AuditLogger $audit,
        SessionRevoker $sessions,
        CanonicalUrlService $canonicalUrls,
        CaddyTlsConfigService $caddy,
        OxidizedEngineConfigService $engine,
    ): RedirectResponse {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'locale' => ['required', Rule::in(SupportedLocale::values())],
            'timezone' => ['required', 'timezone'],
            'domain' => ['nullable', 'string', 'max:253', 'regex:/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i'],
            'canonical_url' => ['nullable', 'url:https', 'max:2048'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['boolean'],
            'default_backup_interval' => ['required', 'integer', 'between:300,604800'],
            'default_timeout' => ['required', 'integer', 'between:5,300'],
            'full_backup_retention_days' => ['required', 'integer', 'between:0,3650'],
            'collection_concurrency' => ['required', 'integer', 'between:1,20'],
            'high_concurrency_confirmation' => [
                Rule::requiredIf((int) $request->input('collection_concurrency') > 10),
                'nullable',
                Rule::in(['HIGH CONCURRENCY']),
            ],
        ]);
        if ((int) $data['collection_concurrency'] > 10) {
            abort_unless(
                (int) $request->session()->get('auth.password_confirmed_at', 0) >= now()->subMinutes(5)->timestamp,
                423,
            );
        }
        $organization = Organization::query()->firstOrFail();
        $settings = array_merge($organization->settings ?? [], [
            'default_backup_interval' => (int) $data['default_backup_interval'],
            'default_timeout' => (int) $data['default_timeout'],
            'full_backup_retention_days' => (int) $data['full_backup_retention_days'],
            'collection_concurrency' => (int) $data['collection_concurrency'],
        ]);
        try {
            $canonicalUrl = filled($data['canonical_url'] ?? null)
                ? $canonicalUrls->normalize((string) $data['canonical_url'])
                : (filled($data['domain'] ?? null) ? 'https://'.strtolower((string) $data['domain']) : null);
        } catch (\InvalidArgumentException) {
            return back()->withErrors(['canonical_url' => __('netkeep.system.canonical_url_origin_only')]);
        }
        try {
            $tlsReloadScheduled = $caddy->configure($canonicalUrl);
        } catch (\Throwable) {
            return back()->withErrors(['canonical_url' => __('netkeep.system.canonical_tls_failed')]);
        }
        try {
            $engine->configure((int) $data['collection_concurrency']);
        } catch (\Throwable) {
            try {
                $caddy->configure($organization->canonical_url);
            } catch (\Throwable) {
            }

            return back()->withErrors(['collection_concurrency' => __('netkeep.system.engine_security_failed')]);
        }
        $canonicalChanged = $organization->canonical_url !== $canonicalUrl;
        $logoPath = $organization->logo_path;
        if ((bool) ($data['remove_logo'] ?? false)) {
            Storage::disk('public')->delete((string) $logoPath);
            $logoPath = null;
        }
        if ($request->hasFile('logo')) {
            Storage::disk('public')->delete((string) $logoPath);
            $logoPath = $request->file('logo')?->store('branding', 'public');
        }

        $organization->update([
            'name' => $data['name'],
            'locale' => $data['locale'],
            'timezone' => $data['timezone'],
            'domain' => $data['domain'] ?: null,
            'canonical_url' => $canonicalUrl,
            'logo_path' => $logoPath,
            'settings' => $settings,
        ]);
        $audit->record('system.settings_updated', $organization, [
            'domain' => $organization->domain,
            'locale' => $organization->locale,
            'retention_days' => $settings['full_backup_retention_days'],
            'collection_concurrency' => $settings['collection_concurrency'],
            'canonical_url_changed' => $canonicalChanged,
        ]);
        if ($canonicalChanged && $organization->setup_completed_at) {
            Passkeys::passkeyModel()::query()->delete();
            $sessions->everyone();

            if ($tlsReloadScheduled) {
                return redirect()->route('tls.activation');
            }

            return redirect()->away(rtrim((string) $canonicalUrl, '/').'/login');
        }

        return back()->with('success', __('netkeep.system.updated'));
    }
}
