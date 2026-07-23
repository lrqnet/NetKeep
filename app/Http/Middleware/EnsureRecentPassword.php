<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRecentPassword
{
    public function handle(Request $request, Closure $next, int $minutes = 5): Response
    {
        $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);
        if ($confirmedAt >= now()->subMinutes($minutes)->timestamp) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(423, __('auth.password'));
        }

        $request->session()->put('url.intended', $request->fullUrl());

        return redirect()->route('password.confirm');
    }
}
