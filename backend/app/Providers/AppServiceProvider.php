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
        // The chat assistant talks to its provider through a narrow contract so
        // the service's own logic stays testable without network access.
        //
        // Anthropic is the only provider that ever serves real traffic. The
        // development mock exists so the chat UI can be built and demonstrated
        // without a key, and it is reachable ONLY when both hold:
        //
        //   1. no ANTHROPIC_API_KEY is configured, and
        //   2. the app is running under APP_ENV=local or development.
        //
        // Production is excluded by that second condition, so a missing key in
        // production keeps the existing behaviour — AnthropicChatProvider is
        // used and returns `ai_not_configured`, a visible 503, rather than
        // silently answering with canned text. The `testing` environment is
        // excluded for the same reason, so the suite exercises the real
        // binding unless a test opts in.
        $this->app->bind(
            \App\Services\Chat\ChatCompletionProvider::class,
            function ($app) {
                $keyIsMissing = blank(config('services.anthropic.api_key'));

                if ($keyIsMissing && $app->environment(['local', 'development'])) {
                    return $app->make(\App\Services\Chat\MockChatProvider::class);
                }

                return $app->make(\App\Services\Chat\AnthropicChatProvider::class);
            },
        );

        // Knowledge sources the assistant may consult. Every source listed here
        // reads only data the public website already publishes, using the same
        // visibility predicates as the public controllers. Nothing that exposes
        // private, admin-only, draft or archived content belongs in this list.
        $this->app->singleton(
            \App\Services\Chat\Knowledge\KnowledgeBase::class,
            fn ($app) => new \App\Services\Chat\Knowledge\KnowledgeBase([
                $app->make(\App\Services\Chat\Knowledge\FaqKnowledgeSource::class),
                $app->make(\App\Services\Chat\Knowledge\ProgramKnowledgeSource::class),
            ]),
        );
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
