<?php

use App\Http\Middleware\ConfigureRequestSecurity;
use App\Http\Middleware\ConfigureSessionSecurity;
use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureCanonicalPasskeys;
use App\Http\Middleware\EnsureInternalToken;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureSetupComplete;
use App\Http\Middleware\EnsureTrustedHost;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(ConfigureSessionSecurity::class);
        $middleware->encryptCookies(except: ['appearance', 'netkeep_locale', 'sidebar_state']);

        $middleware->web(
            prepend: [EnsureTrustedHost::class, ConfigureRequestSecurity::class, EnsureCanonicalPasskeys::class],
            append: [
                EnsureActiveUser::class,
                HandleAppearance::class,
                SetLocale::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
                SecurityHeaders::class,
            ],
        );

        $middleware->alias([
            'internal.token' => EnsureInternalToken::class,
            'role' => EnsureRole::class,
            'setup.complete' => EnsureSetupComplete::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
