<?php

namespace App\Http\Controllers;

use App\Enums\BackupDestinationRunStatus;
use App\Jobs\RunFullBackup;
use App\Models\BackupDestination;
use App\Services\AuditLogger;
use App\Services\GitMirrorService;
use App\Services\OutboundUrlGuard;
use App\Services\SafeHttpClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DataProtectionController extends Controller
{
    public function index(): Response
    {
        $destinations = BackupDestination::query()
            ->where('is_system', false)
            ->with('latestArchive')
            ->orderBy('name')
            ->get()
            ->map(function (BackupDestination $destination): array {
                $archive = $destination->latestArchive;
                $status = $destination->last_run_status->value ?? $archive->status ?? null;
                $ranAt = $destination->last_run_at ?? $archive->completed_at ?? $archive->started_at ?? null;

                return [
                    'id' => $destination->id,
                    'type' => $destination->type,
                    'name' => $destination->name,
                    'enabled' => $destination->enabled,
                    'last_run' => $status === null ? null : [
                        'status' => $status,
                        'ran_at' => $ranAt,
                        'size' => $status === BackupDestinationRunStatus::Completed->value
                            && $archive?->status === BackupDestinationRunStatus::Completed->value
                            ? $archive->size
                            : null,
                    ],
                ];
            });

        return Inertia::render('data-protection/index', [
            'destinations' => $destinations,
            'summary' => [
                'active' => $destinations->where('enabled', true)->count(),
                'paused' => $destinations->where('enabled', false)->count(),
                'failed' => $destinations
                    ->filter(fn (array $destination): bool => ($destination['last_run']['status'] ?? null)
                        === BackupDestinationRunStatus::Failed->value)
                    ->count(),
            ],
        ]);
    }

    public function store(
        Request $request,
        AuditLogger $audit,
        OutboundUrlGuard $urls,
        SafeHttpClient $http,
    ): RedirectResponse {
        $data = $request->validate([
            'type' => ['required', Rule::in(['git', 's3', 'local'])],
            'name' => ['required', 'string', 'max:120'],
            'enabled' => ['boolean'],
            'config' => ['required', 'array'],
            'config.encryption_mode' => ['required_if:type,s3,local', 'nullable', Rule::in(['password', 'keyfile'])],
            'config.password' => ['required_if:config.encryption_mode,password', 'nullable', 'string', 'min:16', 'max:10000'],
            'config.recipient' => ['required_if:config.encryption_mode,keyfile', 'nullable', 'regex:/^age1[0-9a-z]{58}$/'],
            'config.endpoint' => ['nullable', 'url:http,https', 'max:1000'],
            'config.bucket' => ['required_if:type,s3', 'nullable', 'string', 'max:255'],
            'config.region' => ['nullable', 'string', 'max:100'],
            'config.key' => ['required_if:type,s3', 'nullable', 'string', 'max:1000'],
            'config.secret' => ['required_if:type,s3', 'nullable', 'string', 'max:10000'],
            'config.url' => ['required_if:type,git', 'nullable', 'string', 'max:1000'],
            'config.auth_type' => ['required_if:type,git', 'nullable', Rule::in(['token', 'ssh'])],
            'config.token' => ['required_if:config.auth_type,token', 'nullable', 'string', 'max:10000'],
            'config.private_key' => ['required_if:config.auth_type,ssh', 'nullable', 'string', 'max:50000'],
            'config.confirm_private' => ['exclude_unless:type,git', 'required', 'accepted'],
        ]);
        if ($data['type'] === 's3' && filled($data['config']['endpoint'] ?? null)) {
            $urls->assertAllowed((string) $data['config']['endpoint']);
        }
        if ($data['type'] === 'git') {
            $this->ensurePrivateGitDestination(
                (string) ($data['config']['url'] ?? ''),
                (string) ($data['config']['token'] ?? ''),
                $http,
            );
        }
        $allowedConfigKeys = match ($data['type']) {
            's3' => ['endpoint', 'bucket', 'region', 'key', 'secret', 'encryption_mode', 'password', 'recipient'],
            'local' => ['encryption_mode', 'password', 'recipient'],
            'git' => ['url', 'auth_type', 'token', 'private_key'],
            default => throw new \LogicException('Unsupported data protection destination type.'),
        };
        $data['config'] = array_intersect_key($data['config'], array_flip($allowedConfigKeys));
        $destination = BackupDestination::query()->create($data);
        $audit->record('backup.destination_created', $destination, ['type' => $destination->type]);

        return back()->with('success', __('netkeep.data_protection.destination_created'));
    }

    public function update(Request $request, BackupDestination $destination, AuditLogger $audit): RedirectResponse
    {
        abort_if($destination->is_system, 404);
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);
        $destination->update($data);
        $audit->record('backup.destination_status_updated', $destination, ['active' => $destination->enabled]);

        return back()->with(
            'success',
            __($destination->enabled
                ? 'netkeep.data_protection.destination_enabled'
                : 'netkeep.data_protection.destination_paused'),
        );
    }

    public function runBackup(BackupDestination $destination, AuditLogger $audit): RedirectResponse
    {
        abort_if($destination->is_system, 404);
        abort_unless(in_array($destination->type, ['s3', 'local'], true) && $destination->enabled, 422);
        $destination->markRunStatus(BackupDestinationRunStatus::Queued);
        RunFullBackup::dispatch($destination->id);
        $audit->record('backup.queued', $destination);

        return back()->with('success', __('netkeep.data_protection.backup_queued'));
    }

    public function mirrorGit(BackupDestination $destination, GitMirrorService $mirror, AuditLogger $audit): RedirectResponse
    {
        abort_unless($destination->type === 'git' && $destination->enabled, 422);

        try {
            $mirror->mirror($destination);
            $audit->record('backup.git_mirrored', $destination);

            return back()->with('success', __('netkeep.data_protection.mirror_updated'));
        } catch (\Throwable) {
            $audit->record('backup.git_failed', $destination);

            return back()->with('error', __('netkeep.data_protection.mirror_failed'));
        }
    }

    private function ensurePrivateGitDestination(string $url, string $token, SafeHttpClient $http): void
    {
        if (! preg_match('~github\.com[/:]([^/]+)/([^/.]+)(?:\.git)?$~i', $url, $matches)) {
            return;
        }

        $response = $http->pending('https://api.github.com', 1048576)
            ->acceptJson()
            ->withToken($token)
            ->get("https://api.github.com/repos/{$matches[1]}/{$matches[2]}");
        $http->assertResponseSize($response, 1048576);
        if ($response->successful() && $response->json('private') === false) {
            abort(422, __('netkeep.data_protection.public_git'));
        }
    }
}
