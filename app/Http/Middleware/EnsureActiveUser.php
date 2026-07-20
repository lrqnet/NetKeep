<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->is_active) {
            return $this->logoutInactive($request);
        }

        $response = $next($request);

        if (Auth::check() && ! Auth::user()->is_active) {
            return $this->logoutInactive($request);
        }

        return $response;
    }

    private function logoutInactive(Request $request): Response
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json(['message' => __('auth.failed')], 403);
        }

        return redirect()->route('login')->withErrors(['email' => __('auth.failed')]);
    }
}
