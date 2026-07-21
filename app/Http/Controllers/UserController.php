<?php

namespace App\Http\Controllers;

use App\Enums\SupportedLocale;
use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\AccountEmailChanged;
use App\Services\AuditLogger;
use App\Services\DangerousFeatureService;
use App\Services\SessionRevoker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('users/index', [
            'users' => User::query()->orderBy('name')->get([
                'id', 'name', 'email', 'role', 'locale', 'is_active', 'last_login_at', 'created_at',
            ]),
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role): array => [
                'value' => $role->value,
                'label' => __("netkeep.roles.{$role->value}"),
            ]),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'not_regex:/\s/u', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::enum(UserRole::class), 'not_in:owner'],
            'locale' => ['required', Rule::in(SupportedLocale::values())],
        ]);
        $user = User::query()->create($data + [
            'password' => Str::password(40),
            'email_verified_at' => now(),
        ]);
        $status = Password::sendResetLink(['email' => $user->email]);
        $audit->record('user.invited', $user, ['role' => $user->role->value, 'mail_status' => $status]);

        return back()->with(
            $status === Password::RESET_LINK_SENT ? 'success' : 'warning',
            $status === Password::RESET_LINK_SENT
                ? __('netkeep.users.invite_sent')
                : __('netkeep.users.invite_manual'),
        );
    }

    public function update(
        Request $request,
        User $user,
        AuditLogger $audit,
        SessionRevoker $sessions,
    ): RedirectResponse {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email', $user->email)))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'not_regex:/\s/u', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::enum(UserRole::class)],
            'locale' => ['required', Rule::in(SupportedLocale::values())],
            'is_active' => ['required', 'boolean'],
        ]);

        $actor = $request->user();
        abort_if($actor->role === UserRole::Administrator && $user->role === UserRole::Owner, 403);
        abort_if($user->role === UserRole::Owner && $data['role'] !== UserRole::Owner->value, 422, __('netkeep.users.transfer_separately'));
        abort_if($request->user()->is($user) && ! $data['is_active'], 422, __('netkeep.users.cannot_disable_self'));
        abort_if($user->role === UserRole::Owner && ! $data['is_active'], 422, __('netkeep.users.use_transfer'));
        abort_if($data['role'] === UserRole::Owner->value, 422, __('netkeep.users.use_transfer'));

        $oldEmail = $user->email;
        $user->update($data);
        if (! $user->is_active) {
            $sessions->all($user);
        }
        $emailChanged = ! hash_equals($oldEmail, $user->email);
        $audit->record('user.updated', $user, [
            'role' => $user->role->value,
            'is_active' => $user->is_active,
            'email_changed' => $emailChanged,
        ]);
        if ($emailChanged) {
            foreach (array_unique([$oldEmail, $user->email]) as $address) {
                try {
                    Notification::route('mail', $address)
                        ->notify((new AccountEmailChanged($oldEmail, $user->email))->locale($user->preferredLocale()));
                } catch (\Throwable) {
                    continue;
                }
            }
        }

        return back()->with('success', __('netkeep.users.updated'));
    }

    public function transferOwnership(
        Request $request,
        User $user,
        AuditLogger $audit,
        DangerousFeatureService $dangerous,
    ): RedirectResponse {
        abort_unless($request->user()->role === UserRole::Owner, 403);
        abort_if($request->user()->is($user), 422, __('netkeep.users.already_owner'));
        abort_unless($user->is_active, 422, __('netkeep.users.owner_must_be_active'));

        $oldOwner = $request->user();
        DB::transaction(function () use ($oldOwner, $user): void {
            $locked = User::query()->whereKey([$oldOwner->id, $user->id])->lockForUpdate()->get()->keyBy('id');
            $locked->get($oldOwner->id)->update(['role' => UserRole::Administrator]);
            $locked->get($user->id)->update(['role' => UserRole::Owner]);
        });
        $dangerous->disableAll();
        $audit->record('ownership.transferred', $user, ['previous_owner_id' => $oldOwner->id]);

        return back()->with('success', __('netkeep.users.ownership_transferred'));
    }
}
