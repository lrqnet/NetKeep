<?php

namespace App\Http\Middleware;

use App\Enums\DangerousFeature;
use App\Services\CanonicalUrlService;
use App\Services\DangerousFeatureService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class ConfigureSessionSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        $canonical = app(CanonicalUrlService::class)->url();
        $isIpHost = filter_var($request->getHost(), FILTER_VALIDATE_IP) !== false;
        $unsafeRecovery = $isIpHost
            && ! $request->isSecure()
            && Schema::hasTable('organizations')
            && app(DangerousFeatureService::class)->enabled(DangerousFeature::HttpIpLogin);

        $request->attributes->set('netkeep_unsafe_http_ip', $unsafeRecovery);
        config([
            'session.secure' => $unsafeRecovery ? false : ($canonical ? true : $request->isSecure()),
            'session.lifetime' => $unsafeRecovery
                ? 5
                : (int) config('netkeep.session.lifetime', 120),
            'session.expire_on_close' => $unsafeRecovery
                ? true
                : (bool) config('netkeep.session.expire_on_close', false),
            'session.cookie' => $unsafeRecovery ? 'netkeep_recovery_session' : 'netkeep_session',
        ]);

        if ($unsafeRecovery) {
            $request->merge(['remember' => false]);
        }

        return $next($request);
    }
}
