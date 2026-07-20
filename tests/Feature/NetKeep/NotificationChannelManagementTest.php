<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Jobs\SendAlert;
use App\Models\AuditEvent;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\NotificationSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class NotificationChannelManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_channel_keeps_only_its_allowed_configuration(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'webhook',
                'name' => 'NOC Webhook',
                'enabled' => true,
                'events' => ['change', 'failure'],
                'config' => [
                    'url' => 'https://198.51.100.20/netkeep',
                    'secret' => 'example-hmac-secret',
                    'host' => '198.51.100.25',
                    'unexpected' => 'discarded',
                ],
            ])
            ->assertRedirect();

        $channel = NotificationChannel::query()->firstOrFail();
        $this->assertTrue($channel->enabled);
        $this->assertSame(['change', 'failure'], $channel->events);
        $this->assertSame([
            'url' => 'https://198.51.100.20/netkeep',
            'secret' => 'example-hmac-secret',
        ], $channel->config);
    }

    public function test_telegram_and_smtp_channels_store_contextual_configuration(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'telegram',
                'name' => 'Telegram NOC',
                'enabled' => true,
                'events' => ['recovery'],
                'config' => [
                    'bot_token' => '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
                    'chat_id' => '-1001234567890',
                    'url' => 'https://198.51.100.20/discarded',
                ],
            ])
            ->assertRedirect();

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'smtp',
                'name' => 'E-mail NOC',
                'enabled' => true,
                'events' => ['backup', 'update'],
                'config' => [
                    'host' => '198.51.100.25',
                    'port' => 587,
                    'encryption' => 'tls',
                    'username' => 'netkeep@example.com',
                    'password' => 'example-password',
                    'from' => 'netkeep@example.com',
                    'to' => 'noc@example.com',
                    'bot_token' => '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
                ],
            ])
            ->assertRedirect();

        $telegram = NotificationChannel::query()->where('type', 'telegram')->firstOrFail();
        $smtp = NotificationChannel::query()->where('type', 'smtp')->firstOrFail();

        $this->assertSame([
            'bot_token' => '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
            'chat_id' => '-1001234567890',
        ], $telegram->config);
        $this->assertSame([
            'host' => '198.51.100.25',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'netkeep@example.com',
            'password' => 'example-password',
            'from' => 'netkeep@example.com',
            'to' => 'noc@example.com',
        ], $smtp->config);
    }

    public function test_each_channel_type_requires_its_contextual_fields(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'webhook',
                'name' => 'Webhook',
                'enabled' => true,
                'events' => ['change'],
                'config' => ['secret' => 'example-secret'],
            ])
            ->assertSessionHasErrors('config.url');

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'telegram',
                'name' => 'Telegram',
                'enabled' => true,
                'events' => ['failure'],
                'config' => ['chat_id' => '123456'],
            ])
            ->assertSessionHasErrors('config.bot_token');

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'smtp',
                'name' => 'SMTP',
                'enabled' => true,
                'events' => ['recovery'],
                'config' => ['host' => 'smtp.example.com'],
            ])
            ->assertSessionHasErrors([
                'config.port',
                'config.from',
                'config.to',
            ]);
    }

    public function test_channel_requires_at_least_one_supported_event(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'webhook',
                'name' => 'Webhook',
                'enabled' => true,
                'events' => [],
                'config' => ['url' => 'https://198.51.100.20/netkeep'],
            ])
            ->assertSessionHasErrors('events');

        $this->actingAs($owner)
            ->post('/notifications/channels', [
                'type' => 'webhook',
                'name' => 'Webhook',
                'enabled' => true,
                'events' => ['unknown'],
                'config' => ['url' => 'https://198.51.100.20/netkeep'],
            ])
            ->assertSessionHasErrors('events.0');
    }

    public function test_custom_smtp_port_requires_owner_recent_reauthentication_and_exact_confirmation(): void
    {
        $administrator = User::factory()->create(['role' => UserRole::Administrator]);
        $payload = [
            'type' => 'smtp',
            'name' => 'Custom SMTP',
            'enabled' => true,
            'events' => ['failure'],
            'config' => [
                'host' => '198.51.100.25',
                'port' => 2525,
                'encryption' => 'tls',
                'from' => 'netkeep@example.com',
                'to' => 'noc@example.com',
                'port_confirmation' => 'I ACCEPT SMTP PORT 2525',
            ],
        ];

        $this->actingAs($administrator)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/notifications/channels', $payload)
            ->assertForbidden();

        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/notifications/channels', $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('notification_channels', [
            'name' => 'Custom SMTP',
            'type' => 'smtp',
        ]);
    }

    public function test_owner_can_pause_and_enable_a_channel_with_auditing(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $channel = NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'NOC',
            'enabled' => true,
            'events' => ['change'],
            'config' => ['url' => 'https://198.51.100.20/netkeep'],
        ]);

        $this->actingAs($owner)
            ->patch("/notifications/channels/{$channel->id}", ['enabled' => false])
            ->assertRedirect();

        $this->assertFalse($channel->refresh()->enabled);
        $this->assertDatabaseHas('audit_events', [
            'action' => 'notification.channel_status_updated',
            'subject_id' => $channel->id,
        ]);
        $this->assertSame(
            ['active' => false],
            AuditEvent::query()
                ->where('action', 'notification.channel_status_updated')
                ->where('subject_id', $channel->id)
                ->latest('id')
                ->firstOrFail()
                ->metadata,
        );

        $this->actingAs($owner)
            ->patch("/notifications/channels/{$channel->id}", ['enabled' => true])
            ->assertRedirect();

        $this->assertTrue($channel->refresh()->enabled);
    }

    public function test_operator_cannot_change_channel_status(): void
    {
        $operator = User::factory()->create(['role' => UserRole::Operator]);
        $channel = NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'NOC',
            'enabled' => true,
            'events' => ['change'],
            'config' => ['url' => 'https://198.51.100.20/netkeep'],
        ]);

        $this->actingAs($operator)
            ->patch("/notifications/channels/{$channel->id}", ['enabled' => false])
            ->assertForbidden();

        $this->assertTrue($channel->refresh()->enabled);
    }

    public function test_notification_page_exposes_only_safe_channel_test_status_and_summary(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        NotificationChannel::query()->create([
            'type' => 'telegram',
            'name' => 'Telegram NOC',
            'enabled' => true,
            'events' => ['failure'],
            'config' => [
                'bot_token' => '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
                'chat_id' => '123456',
            ],
            'last_tested_at' => now(),
            'last_error' => 'Internal transport details',
        ]);

        $this->actingAs($owner)
            ->get('/notifications')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notifications/index')
                ->where('channels.0.last_test_succeeded', false)
                ->where('channels.0.enabled', true)
                ->where('summary.active', 1)
                ->where('summary.paused', 0)
                ->where('summary.failed', 1)
                ->missing('channels.0.last_error')
                ->missing('channels.0.config'));
    }

    public function test_paused_channel_skips_operational_alerts_but_can_be_tested(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $paused = NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'Pausado',
            'enabled' => false,
            'events' => ['change'],
            'config' => ['url' => 'https://198.51.100.20/paused'],
        ]);
        NotificationChannel::query()->create([
            'type' => 'webhook',
            'name' => 'Ativo',
            'enabled' => true,
            'events' => ['change'],
            'config' => ['url' => 'https://198.51.100.21/active'],
        ]);
        Http::fake(['*' => Http::response([], 204)]);

        (new SendAlert('change', 'netkeep.notifications.test_message'))
            ->handle(app(NotificationSender::class));

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://198.51.100.21/active');

        $this->actingAs($owner)
            ->post("/notifications/channels/{$paused->id}/test")
            ->assertRedirect();

        Http::assertSentCount(2);
        $this->assertFalse($paused->refresh()->enabled);
        $this->assertNotNull($paused->last_tested_at);
        $this->assertNull($paused->last_error);
    }
}
