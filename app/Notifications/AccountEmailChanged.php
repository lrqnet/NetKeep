<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountEmailChanged extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $oldEmail,
        private readonly string $newEmail,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('netkeep.users.email_changed_subject'))
            ->line(__('netkeep.users.email_changed_body'))
            ->line(__('netkeep.users.email_changed_from', ['email' => $this->oldEmail]))
            ->line(__('netkeep.users.email_changed_to', ['email' => $this->newEmail]))
            ->line(__('netkeep.users.email_changed_action'));
    }
}
