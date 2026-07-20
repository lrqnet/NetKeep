<?php

namespace App\Providers;

use App\Services\AuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );

        Event::listen(Login::class, function (Login $event): void {
            $event->user->forceFill(['last_login_at' => now()])->saveQuietly();
            app(AuditLogger::class)->record(
                'auth.login',
                $event->user instanceof Model ? $event->user : null,
            );
        });
        Event::listen(Logout::class, function (Logout $event): void {
            app(AuditLogger::class)->record(
                'auth.logout',
                $event->user instanceof Model ? $event->user : null,
            );
        });
        Event::listen(Failed::class, function (Failed $event): void {
            app(AuditLogger::class)->record(
                'auth.failed',
                $event->user instanceof Model ? $event->user : null,
                ['identity_hash' => hash('sha256', strtolower((string) ($event->credentials['email'] ?? '')))],
            );
        });
        Event::listen(PasswordReset::class, function (PasswordReset $event): void {
            app(AuditLogger::class)->record(
                'auth.password_reset',
                $event->user instanceof Model ? $event->user : null,
            );
        });
        Event::listen(Registered::class, function (Registered $event): void {
            app(AuditLogger::class)->record(
                'auth.owner_registered',
                $event->user instanceof Model ? $event->user : null,
            );
        });
    }
}
