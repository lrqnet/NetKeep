<?php

namespace App\Http\Controllers;

use App\Models\NotificationChannel;
use App\Models\Organization;
use App\Services\AuditLogger;
use App\Services\NetworkTargetGuard;
use App\Services\NotificationSender;
use App\Services\OutboundUrlGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NotificationChannelController extends Controller
{
    public function index(): Response
    {
        $channels = NotificationChannel::query()->orderBy('name')->get()->map(fn (NotificationChannel $channel): array => [
            'id' => $channel->id,
            'type' => $channel->type,
            'name' => $channel->name,
            'enabled' => $channel->enabled,
            'events' => $channel->events,
            'last_tested_at' => $channel->last_tested_at,
            'last_test_succeeded' => $channel->last_tested_at === null
                ? null
                : blank($channel->last_error),
        ]);

        return Inertia::render('notifications/index', [
            'channels' => $channels,
            'summary' => [
                'active' => $channels->filter(fn (array $channel): bool => $channel['enabled'] === true)->count(),
                'paused' => $channels->filter(fn (array $channel): bool => $channel['enabled'] === false)->count(),
                'failed' => $channels->filter(fn (array $channel): bool => $channel['last_test_succeeded'] === false)->count(),
            ],
        ]);
    }

    public function store(
        Request $request,
        AuditLogger $audit,
        OutboundUrlGuard $urls,
        NetworkTargetGuard $targets,
    ): RedirectResponse {
        $data = $request->validate([
            'type' => ['required', Rule::in(['smtp', 'webhook', 'telegram'])],
            'name' => ['required', 'string', 'max:120'],
            'enabled' => ['boolean'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => [Rule::in(['change', 'failure', 'recovery', 'overdue', 'backup', 'update'])],
            'config' => ['required', 'array'],
            'config.url' => ['required_if:type,webhook', 'nullable', 'url:http,https', 'max:1000'],
            'config.secret' => ['nullable', 'string', 'max:10000'],
            'config.bot_token' => ['required_if:type,telegram', 'nullable', 'regex:/^[0-9]{5,20}:[A-Za-z0-9_-]{20,}$/'],
            'config.chat_id' => ['required_if:type,telegram', 'nullable', 'string', 'max:100'],
            'config.host' => ['required_if:type,smtp', 'nullable', 'string', 'max:255'],
            'config.port' => ['required_if:type,smtp', 'nullable', 'integer', 'between:1,65535'],
            'config.encryption' => ['nullable', Rule::in(['', 'tls', 'ssl'])],
            'config.username' => ['nullable', 'string', 'max:255'],
            'config.password' => ['nullable', 'string', 'max:10000'],
            'config.from' => ['required_if:type,smtp', 'nullable', 'email', 'max:255'],
            'config.to' => ['required_if:type,smtp', 'nullable', 'email', 'max:255'],
            'config.port_confirmation' => ['nullable', 'string', 'max:80'],
        ]);
        if ($data['type'] === 'webhook') {
            $urls->assertAllowed((string) $data['config']['url']);
        }
        if ($data['type'] === 'smtp') {
            $targets->resolve((string) $data['config']['host']);
            $port = (int) $data['config']['port'];
            if (! in_array($port, [25, 465, 587], true)) {
                abort_unless($request->user()->role->canManageOwnership(), 403);
                abort_unless(
                    (int) $request->session()->get('auth.password_confirmed_at', 0)
                        >= now()->subMinutes(5)->timestamp,
                    423,
                );
                abort_unless(
                    hash_equals("I ACCEPT SMTP PORT {$port}", (string) ($data['config']['port_confirmation'] ?? '')),
                    422,
                    __('netkeep.notifications.smtp_port_confirmation_invalid'),
                );
            }
        }
        $allowedConfigKeys = match ($data['type']) {
            'webhook' => ['url', 'secret'],
            'telegram' => ['bot_token', 'chat_id'],
            'smtp' => ['host', 'port', 'encryption', 'username', 'password', 'from', 'to'],
            default => throw new \LogicException('Unsupported notification channel type.'),
        };
        $data['config'] = array_intersect_key($data['config'], array_flip($allowedConfigKeys));
        $channel = NotificationChannel::query()->create($data);
        $audit->record('notification.channel_created', $channel, ['type' => $channel->type, 'events' => $channel->events]);

        return back()->with('success', __('netkeep.notifications.channel_created'));
    }

    public function update(Request $request, NotificationChannel $channel, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);
        $channel->update($data);
        $audit->record('notification.channel_status_updated', $channel, ['active' => $channel->enabled]);

        return back()->with(
            'success',
            __($channel->enabled
                ? 'netkeep.notifications.channel_enabled'
                : 'netkeep.notifications.channel_paused'),
        );
    }

    public function test(NotificationChannel $channel, AuditLogger $audit, NotificationSender $sender): RedirectResponse
    {
        try {
            $locale = Organization::query()->value('locale') ?? 'en';
            $sender->send(
                $channel,
                'netkeep.test',
                (string) Lang::get('netkeep.notifications.test_message', [], $locale),
                ['test' => true],
            );
            $channel->update(['last_tested_at' => now(), 'last_error' => null]);
            $audit->record('notification.channel_tested', $channel, ['ok' => true]);

            return back()->with('success', __('netkeep.notifications.test_sent'));
        } catch (\Throwable $exception) {
            $channel->update(['last_tested_at' => now(), 'last_error' => $exception->getMessage()]);
            $audit->record('notification.channel_tested', $channel, ['ok' => false]);

            return back()->with('error', __('netkeep.notifications.test_failed'));
        }
    }
}
