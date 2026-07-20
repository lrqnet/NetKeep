<?php

namespace App\Jobs;

use App\Models\NotificationChannel;
use App\Models\Organization;
use App\Services\NotificationSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Lang;

class SendAlert implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        public string $event,
        public string $messageKey,
        public array $context = [],
    ) {}

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 30, 120, 600];
    }

    public function handle(NotificationSender $sender): void
    {
        $locale = Organization::query()->value('locale') ?? 'en';
        $message = (string) Lang::get($this->messageKey, $this->context, $locale);

        NotificationChannel::query()
            ->where('enabled', true)
            ->get()
            ->filter(fn (NotificationChannel $channel): bool => in_array($this->event, $channel->events ?? [], true))
            ->each(fn (NotificationChannel $channel) => $sender->send($channel, $this->event, $message, $this->context));
    }
}
