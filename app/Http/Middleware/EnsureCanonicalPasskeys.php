<?php

namespace App\Http\Middleware;

use App\Services\CanonicalUrlService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanonicalPasskeys
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('passkeys/*') || $request->is('user/passkeys*')) {
            $canonical = app(CanonicalUrlService::class)->url();
            abort_unless($canonical && str_starts_with($canonical, 'https://'), 403);
            abort_unless($request->isSecure(), 403);
            abort_unless(strcasecmp($request->getHost(), (string) parse_url($canonical, PHP_URL_HOST)) === 0, 403);
        }

        return $next($request);
    }
}
