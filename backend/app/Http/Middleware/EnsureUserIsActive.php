<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Reject authenticated requests from accounts that are no longer active.
 *
 * Disabling an account must invalidate access immediately, including for
 * bearer tokens issued before the account was suspended or deactivated.
 * The presented token is revoked so it cannot be replayed later even if
 * the account is re-activated.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== 'active') {
            $accessToken = $user->currentAccessToken();

            if ($accessToken instanceof PersonalAccessToken) {
                $accessToken->delete();
            }

            return response()->json([
                'success' => false,
                'message' => 'This account has been disabled.',
                'errors' => ['code' => ['account_disabled']],
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
