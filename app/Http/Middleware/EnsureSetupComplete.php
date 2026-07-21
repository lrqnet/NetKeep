<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSetupComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->routeIs('setup.*') && ! Organization::query()->whereNotNull('setup_completed_at')->exists()) {
            return redirect()->route('setup.show');
        }

        return $next($request);
    }
}
