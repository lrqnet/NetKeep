<?php

namespace App\Http\Middleware;

use App\Services\CanonicalUrlService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class ConfigureRequestSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        app(CanonicalUrlService::class)->configure();
        $canonical = app(CanonicalUrlService::class)->url();
        $canonicalHost = $canonical ? (string) parse_url($canonical, PHP_URL_HOST) : null;
        $isIpHost = filter_var($request->getHost(), FILTER_VALIDATE_IP) !== false;
        $unsafeRecovery = (bool) $request->attributes->get('netkeep_unsafe_http_ip', false);

        if (Schema::hasTable('organizations')) {
            $safeRecoveryRoute = $request->routeIs([
                'home',
                'locale.update',
                'restore.*',
                'tls.*',
                'internal.caddy.ask',
                'internal.oxidized.*',
            ]);
            if (
                $canonicalHost
                && strcasecmp($request->getHost(), $canonicalHost) === 0
                && ! $request->isSecure()
                && ! $unsafeRecovery
                && ! $safeRecoveryRoute
            ) {
                return redirect()->secure($request->getRequestUri(), 308);
            }

            if ($canonical && $isIpHost && ! $request->isSecure() && ! $unsafeRecovery && ! $safeRecoveryRoute) {
                return redirect('/')->with('warning', __('netkeep.security.http_ip_login_blocked'));
            }
        }

        return $next($request);
    }
}
