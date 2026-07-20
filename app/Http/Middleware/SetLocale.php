<?php

namespace App\Http\Middleware;

use App\Enums\SupportedLocale;
use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $userLocale = $request->user()?->locale;
        $cookie = $request->cookie('netkeep_locale');
        $cookieLocale = is_string($cookie) ? $cookie : null;
        $organizationLocale = Schema::hasTable('organizations')
            ? Organization::query()->value('locale')
            : null;

        $locale = SupportedLocale::tryFrom((string) $userLocale)
            ?? SupportedLocale::tryFrom((string) $cookieLocale)
            ?? SupportedLocale::tryFrom((string) $organizationLocale)
            ?? SupportedLocale::English;

        App::setLocale($locale->value);

        return $next($request);
    }
}
