<?php

namespace App\Http\Middleware;

use App\Enums\SupportedLocale;
use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $version = (string) config('netkeep.version');
        $sourceUrl = rtrim((string) config('netkeep.source_url'), '/');
        $sourceRef = $version === 'dev'
            ? 'main'
            : (str_starts_with($version, 'v') ? $version : "v{$version}");

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'availableLocales' => SupportedLocale::options(),
            'auth' => [
                'user' => $request->user(),
            ],
            'organization' => fn () => Organization::query()->first(['name', 'logo_path', 'locale', 'timezone', 'domain']),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'warning' => fn () => $request->session()->get('warning'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'netkeep' => [
                'version' => $version,
                'source_url' => $sourceUrl,
                'source_version_url' => "{$sourceUrl}/tree/{$sourceRef}",
            ],
            'unsafeHttpIpLogin' => (bool) $request->attributes->get('netkeep_unsafe_http_ip', false),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
