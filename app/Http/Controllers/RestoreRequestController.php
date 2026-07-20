<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Services\InstallationClaimService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RestoreRequestController extends Controller
{
    public function index(Request $request): Response
    {
        if ($request->user() && $request->user()->role !== UserRole::Owner) {
            abort(403);
        }

        return Inertia::render('restore', [
            'authenticated' => $request->user() !== null,
            'requestUuid' => $request->session()->get('restore_request_uuid'),
        ]);
    }

    public function store(
        Request $request,
        InstallationClaimService $claims,
    ): RedirectResponse {
        $this->authorizeRequest($request, $claims);
        $data = $request->validate([
            'archive' => ['required', 'file', 'max:2097152'],
            'password' => ['nullable', 'string', 'min:16', 'max:10000'],
            'identity' => ['nullable', 'file', 'max:1024'],
        ]);
        $extension = strtolower((string) $request->file('archive')?->getClientOriginalExtension());
        if (! in_array($extension, ['nkb', 'age'], true)) {
            throw ValidationException::withMessages([
                'archive' => __('netkeep.restore.archive_type_invalid'),
            ]);
        }
        if ($extension === 'nkb' && blank($data['password'] ?? null)) {
            throw ValidationException::withMessages([
                'password' => __('netkeep.restore.password_required'),
            ]);
        }
        if ($extension === 'age' && ! $request->hasFile('identity')) {
            throw ValidationException::withMessages([
                'identity' => __('netkeep.restore.identity_required'),
            ]);
        }

        $uuid = (string) Str::uuid();
        $root = rtrim((string) config('netkeep.restore_inbox'), '/');
        File::ensureDirectoryExists($root, 0700, true);
        $uploadedArchive = $request->file('archive');
        if (! $uploadedArchive instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'archive' => __('validation.uploaded', ['attribute' => __('netkeep.restore.archive')]),
            ]);
        }
        $archive = $uploadedArchive->move($root, "{$uuid}.{$extension}");
        chmod($archive->getPathname(), 0600);
        $identityPath = null;
        if ($request->hasFile('identity')) {
            $uploadedIdentity = $request->file('identity');
            if (! $uploadedIdentity instanceof UploadedFile) {
                throw ValidationException::withMessages([
                    'identity' => __('validation.uploaded', ['attribute' => __('netkeep.restore.identity')]),
                ]);
            }
            $identity = $uploadedIdentity->move($root, "{$uuid}.identity");
            chmod($identity->getPathname(), 0600);
            $identityPath = $identity->getPathname();
        }
        $payload = [
            'uuid' => $uuid,
            'archive' => $archive->getPathname(),
            'password' => filled($data['password'] ?? null)
                ? Crypt::encryptString((string) $data['password'])
                : null,
            'identity' => $identityPath,
            'requested_by' => $request->user()?->id,
            'created_at' => now()->toIso8601String(),
        ];
        $target = "{$root}/.restore-request-{$uuid}.json";
        $temporary = $target.'.partial';
        File::put($temporary, json_encode($payload, JSON_THROW_ON_ERROR), true);
        chmod($temporary, 0600);
        if (! rename($temporary, $target)) {
            $cleanupPaths = [$archive->getPathname(), $temporary];
            if ($identityPath !== null) {
                $cleanupPaths[] = $identityPath;
            }
            File::delete($cleanupPaths);
            throw new \RuntimeException('restore_request_publish_failed');
        }

        return back()
            ->with('restore_request_uuid', $uuid)
            ->with('success', __('netkeep.restore.request_ready'));
    }

    private function authorizeRequest(Request $request, InstallationClaimService $claims): void
    {
        if ($request->user()) {
            abort_unless($request->user()->role === UserRole::Owner, 403);
            abort_unless($request->isSecure(), 403);
            abort_unless(
                (int) $request->session()->get('auth.password_confirmed_at', 0)
                    >= now()->subMinutes(5)->timestamp,
                423,
            );

            return;
        }

        $request->validate(['installation_token' => ['required', 'string', 'max:128']]);
        $claims->validate((string) $request->input('installation_token'));
    }
}
