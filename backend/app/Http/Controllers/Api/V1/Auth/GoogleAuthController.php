<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Services\Auth\GoogleAuthException;
use App\Services\Auth\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

/**
 * Google Sign-In on top of the application's existing Sanctum token auth.
 *
 * Flow: SPA -> GET /auth/google -> Google consent -> GET /auth/google/callback
 * -> user resolved/linked/created -> one-time claim code -> redirect to the SPA
 * -> SPA POSTs the code to /auth/google/exchange and receives the same
 * `{user, token, token_type}` payload that /auth/login returns.
 */
class GoogleAuthController extends BaseController
{
    public function __construct(private readonly GoogleAuthService $googleAuth)
    {
    }

    /** Sends the browser to Google's consent screen. */
    public function redirect(): RedirectResponse|JsonResponse
    {
        if (! $this->isConfigured()) {
            return $this->error(
                'Google Sign-In is not configured on this server.',
                ['code' => ['google_not_configured']],
                503,
            );
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    /**
     * Google redirects the browser back here. Because this is a top-level
     * navigation rather than XHR, every outcome ends in a redirect to the SPA
     * carrying either a one-time claim code or a translatable error code.
     */
    public function callback(Request $request): RedirectResponse|JsonResponse
    {
        if (! $this->isConfigured()) {
            return $this->redirectToApp(['error' => 'google_not_configured']);
        }

        // The user pressed "Cancel" on the consent screen, or Google refused.
        if ($request->filled('error')) {
            $denied = in_array($request->string('error')->toString(), ['access_denied', 'consent_required'], true);

            return $this->redirectToApp(['error' => $denied ? 'cancelled' : 'provider_error']);
        }

        if (! $request->filled('code')) {
            return $this->redirectToApp(['error' => 'callback_failed']);
        }

        try {
            // Stateful by design: Socialite validates the `state` parameter
            // against the session, which is the OAuth 2.0 CSRF defence.
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException) {
            return $this->redirectToApp(['error' => 'invalid_state']);
        } catch (\Throwable $exception) {
            // Network failure, invalid/expired authorization code, malformed
            // provider response. Logged server-side; never surfaced verbatim.
            Log::warning('Google OAuth callback failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return $this->redirectToApp(['error' => 'provider_unavailable']);
        }

        try {
            $result = $this->googleAuth->authenticate($googleUser, $request->userAgent() ?: 'api-client');
        } catch (GoogleAuthException $exception) {
            return $this->redirectToApp(['error' => $exception->reason()]);
        } catch (\Throwable $exception) {
            Log::error('Google OAuth user resolution failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return $this->redirectToApp(['error' => 'callback_failed']);
        }

        return $this->redirectToApp(['code' => $this->googleAuth->stashClaim($result)]);
    }

    /**
     * Exchanges the one-time claim code for the bearer token. Called by the SPA
     * over XHR so the token never appears in a URL.
     */
    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'min:32', 'max:128'],
        ]);

        $result = $this->googleAuth->redeemClaim($validated['code']);

        if ($result === null) {
            return $this->error(
                'This sign-in link is no longer valid. Please try again.',
                ['code' => ['invalid_or_expired_code']],
                401,
            );
        }

        return $this->success([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
            'token_type' => $result['token_type'],
        ], 'Login successful.');
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }

    /**
     * Redirects to the SPA callback route. The target is built from server-side
     * configuration only — a `redirect` supplied by the caller is never
     * honoured, so this endpoint cannot be used as an open redirect.
     */
    private function redirectToApp(array $query): RedirectResponse
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return redirect()->away($base.'/auth/google/callback?'.http_build_query($query));
    }
}
