<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim(
                (string) env('FRONTEND_URL', config('app.url')),
                '/',
            );

            return $frontendUrl.'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
        });

        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            $frontendUrl = rtrim(
                (string) env('FRONTEND_URL', config('app.url')),
                '/',
            );
            $verificationUrl = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addMinutes((int) Config::get('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
            );
            $signedQuery = [];
            parse_str((string) parse_url($verificationUrl, PHP_URL_QUERY), $signedQuery);

            return $frontendUrl.'/verify-email?'.http_build_query([
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
                ...$signedQuery,
                'email' => $notifiable->getEmailForVerification(),
            ]);
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $verificationUrl): MailMessage {
            return (new MailMessage)
                ->subject('Welcome to Mujaddidun — Verify your email')
                ->view('emails.verify-email', [
                    'user' => $notifiable,
                    'verificationUrl' => $verificationUrl,
                    'expiresInMinutes' => (int) Config::get('auth.verification.expire', 60),
                    'logoUrl' => (string) env(
                        'FRONTEND_LOGO_URL',
                        rtrim((string) env('FRONTEND_URL', config('app.url')), '/').'/favicon.png',
                    ),
                ]);
        });
    }
}
