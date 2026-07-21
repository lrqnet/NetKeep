<?php

namespace App\Http\Controllers;

use App\Enums\SupportedLocale;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Cookie;

class LocaleController extends Controller
{
    public function __invoke(Request $request, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', Rule::in(SupportedLocale::values())],
        ]);
        $locale = SupportedLocale::from($validated['locale']);
        $user = $request->user();

        if ($user && $user->locale !== $locale->value) {
            $previous = $user->locale;
            $user->update(['locale' => $locale->value]);
            $audit->record('user.locale_updated', $user, [
                'previous_locale' => $previous,
                'locale' => $locale->value,
            ]);
        }

        $cookie = Cookie::create(
            name: 'netkeep_locale',
            value: $locale->value,
            expire: now()->addYear(),
            path: '/',
            secure: $request->isSecure(),
            httpOnly: true,
            sameSite: Cookie::SAMESITE_LAX,
        );

        return back()->withCookie($cookie);
    }
}
