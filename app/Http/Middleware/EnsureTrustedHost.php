<?php

namespace App\Http\Middleware;

use App\Services\CanonicalUrlService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTrustedHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());
        $canonical = app(CanonicalUrlService::class)->url();
        $canonicalHost = $canonical ? strtolower((string) parse_url($canonical, PHP_URL_HOST)) : null;
        $isIp = filter_var($host, FILTER_VALIDATE_IP) !== false;
        $bootstrap = in_array($host, ['localhost', 'app', '127.0.0.1', '::1'], true) || $isIp;

        abort_unless($host === $canonicalHost || $bootstrap, 400);

        return $next($request);
    }
}
