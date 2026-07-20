<?php

namespace App\Http\Controllers;

use App\Enums\SupportedLocale;
use App\Models\DeviceGroup;
use App\Models\Organization;
use App\Services\AuditLogger;
use App\Services\CaddyTlsConfigService;
use App\Services\CanonicalUrlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SetupController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        $organization = Organization::query()->first();
        if ($organization?->setup_completed_at) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('setup', [
            'organization' => $organization,
            'locales' => collect(SupportedLocale::options())->pluck('label', 'value'),
            'timezones' => ['America/Sao_Paulo', 'America/Bogota', 'America/Mexico_City', 'UTC', 'Europe/Lisbon'],
        ]);
    }

    public function store(
        Request $request,
        AuditLogger $audit,
        CanonicalUrlService $canonicalUrls,
        CaddyTlsConfigService $caddy,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'locale' => ['required', Rule::in(SupportedLocale::values())],
            'timezone' => ['required', 'timezone'],
            'domain' => ['nullable', 'string', 'max:253', 'regex:/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i'],
            'canonical_url' => ['nullable', 'url:https', 'max:2048'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'default_backup_interval' => ['required', 'integer', 'between:300,604800'],
            'default_timeout' => ['required', 'integer', 'between:5,300'],
            'full_backup_retention_days' => ['required', 'integer', 'between:0,3650'],
        ]);

        try {
            $requestHost = $request->getHost();
            $requestHost = str_contains($requestHost, ':') ? "[{$requestHost}]" : $requestHost;
            $canonicalUrl = filled($validated['canonical_url'] ?? null)
                ? $canonicalUrls->normalize((string) $validated['canonical_url'])
                : (filled($validated['domain'] ?? null)
                    ? 'https://'.strtolower((string) $validated['domain'])
                    : $canonicalUrls->normalize('https://'.$requestHost));
        } catch (\InvalidArgumentException) {
            return back()->withErrors(['canonical_url' => __('netkeep.system.canonical_url_origin_only')]);
        }
        try {
            $tlsReloadScheduled = $caddy->configure($canonicalUrl);
        } catch (\Throwable) {
            return back()->withErrors(['canonical_url' => __('netkeep.system.canonical_tls_failed')]);
        }
        $logoPath = $request->file('logo')?->store('branding', 'public');
        $organization = Organization::query()->firstOrNew();
        $organization->fill([
            'name' => $validated['name'],
            'slug' => $organization->slug ?: Str::slug($validated['name']).'-'.Str::lower(Str::random(5)),
            'locale' => $validated['locale'],
            'timezone' => $validated['timezone'],
            'domain' => $validated['domain'] ?? null,
            'canonical_url' => $canonicalUrl,
            'logo_path' => $logoPath ?: $organization->logo_path,
            'settings' => array_merge($organization->settings ?? [], [
                'default_backup_interval' => (int) $validated['default_backup_interval'],
                'default_timeout' => (int) $validated['default_timeout'],
                'full_backup_retention_days' => (int) $validated['full_backup_retention_days'],
            ]),
            'setup_completed_at' => now(),
        ])->save();

        DeviceGroup::query()->firstOrCreate(['name' => 'default']);
        $request->user()->update(['locale' => $validated['locale']]);
        $audit->record('setup.completed', $organization, ['domain' => $validated['domain'] ?? null]);

        if ($tlsReloadScheduled) {
            return redirect()->route('tls.activation');
        }

        return redirect()->away(rtrim($canonicalUrl, '/').'/dashboard');
    }
}
