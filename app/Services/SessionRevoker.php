<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class SessionRevoker
{
    public function all(User $user): void
    {
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->forceFill(['remember_token' => null])->saveQuietly();
    }

    public function except(User $user, string $sessionId): void
    {
        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $sessionId)
            ->delete();
        $user->forceFill(['remember_token' => null])->saveQuietly();
    }

    public function everyone(): void
    {
        DB::table('sessions')->delete();
        User::query()->update(['remember_token' => null]);
    }
}
