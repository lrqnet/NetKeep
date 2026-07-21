<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\SupportedLocale;
use App\Enums\UserRole;
use App\Models\User;
use App\Services\InstallationClaimService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['email'] = Str::lower((string) ($input['email'] ?? ''));

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'installation_token' => ['required', 'string', 'max:128'],
        ])->validate();
        app(InstallationClaimService::class)->validate((string) $input['installation_token']);
        $locale = SupportedLocale::tryFrom((string) app()->getLocale())
            ?? SupportedLocale::English;

        return Cache::lock('netkeep:first-owner', 15)->block(10, function () use ($input, $locale): User {
            if (User::query()->exists()) {
                throw ValidationException::withMessages([
                    'email' => __('netkeep.users.owner_exists'),
                ]);
            }

            $user = DB::transaction(fn (): User => User::query()->create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => UserRole::Owner,
                'locale' => $locale->value,
                'is_active' => true,
                'email_verified_at' => now(),
            ]));
            app(InstallationClaimService::class)->invalidate();

            return $user;
        });
    }
}
