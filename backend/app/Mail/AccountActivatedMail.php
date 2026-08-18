<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent once, when an administrator moves a member account to `active`.
 *
 * This is separate from email verification: verification proves the address
 * belongs to the member, whereas this message tells them a human has approved
 * the account and it can now be used.
 *
 * Not queued, matching ContactMessageReplyMail — the project has no queue
 * worker running locally, so a queued mail would never leave the jobs table.
 */
class AccountActivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(private readonly User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isArabic()
                ? 'تم تفعيل حسابك في منصة مجددون'
                : 'Your Mujaddidun account has been activated',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.account-activated',
            with: [
                'user' => $this->user,
                'isArabic' => $this->isArabic(),
                'loginUrl' => rtrim((string) config('app.frontend_url'), '/').'/login',
                'logoUrl' => (string) env(
                    'FRONTEND_LOGO_URL',
                    rtrim((string) config('app.frontend_url'), '/').'/favicon.png',
                ),
            ],
        );
    }

    private function isArabic(): bool
    {
        return ($this->user->locale ?? 'ar') !== 'en';
    }
}
