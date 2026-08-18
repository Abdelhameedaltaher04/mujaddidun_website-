<?php

namespace App\Services\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

/**
 * Resolves a Google profile onto the application's own user records and issues
 * a Sanctum personal access token — the same token the email/password login
 * returns, so a Google-authenticated user is indistinguishable downstream.
 *
 * The token is never placed in the redirect URL. The callback hands the SPA a
 * single-use, short-lived claim code instead; the SPA exchanges it over XHR.
 * That keeps the bearer token out of browser history, server logs and the
 * Referer header.
 */
class GoogleAuthService
{
    /** Lifetime of the one-time claim code handed to the SPA. */
    private const CLAIM_TTL_SECONDS = 120;

    private const CLAIM_PREFIX = 'google-auth-claim:';

    /**
     * @throws GoogleAuthException
     */
    public function authenticate(SocialiteUser $googleUser, string $tokenName = 'api-client'): array
    {
        $googleId = (string) $googleUser->getId();
        $email = $googleUser->getEmail() !== null ? mb_strtolower(trim($googleUser->getEmail())) : '';

        if ($googleId === '') {
            throw new GoogleAuthException('missing_google_id');
        }

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Google can withhold the address if the user denies the scope, or
            // if the account genuinely has none. Without it we cannot safely
            // match or create a record.
            throw new GoogleAuthException('missing_email');
        }

        $user = DB::transaction(function () use ($googleUser, $googleId, $email): User {
            $byGoogleId = User::query()->where('google_id', $googleId)->first();

            if ($byGoogleId !== null) {
                return $this->touchProfile($byGoogleId, $googleUser);
            }

            $byEmail = User::query()->where('email', $email)->first();

            if ($byEmail !== null) {
                if ($byEmail->google_id !== null && $byEmail->google_id !== $googleId) {
                    // The address already belongs to a different Google account.
                    throw new GoogleAuthException('email_linked_to_other_google_account');
                }

                // Safe link: same address, no Google identity yet. Google has
                // verified ownership of the address, so this is not a takeover.
                $byEmail->google_id = $googleId;

                return $this->touchProfile($byEmail, $googleUser);
            }

            return $this->createUser($googleUser, $googleId, $email);
        });

        if ($user->status !== 'active') {
            throw new GoogleAuthException('account_disabled');
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return [
            'user' => $user->fresh('role'),
            'token' => $user->createToken($tokenName)->plainTextToken,
            'token_type' => 'Bearer',
        ];
    }

    private function createUser(SocialiteUser $googleUser, string $googleId, string $email): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Standard authenticated member access.',
            ],
        );

        [$firstName, $lastName] = $this->splitName($googleUser, $email);

        $user = new User();
        $user->role_id = $role->id;
        $user->first_name = $firstName;
        $user->last_name = $lastName;
        $user->email = $email;
        $user->google_id = $googleId;
        $user->google_avatar_url = $this->avatarUrl($googleUser);
        // No password is stored: there is no Google password, and a random hash
        // would leave an unusable credential on the record.
        $user->password = null;
        $user->status = 'active';
        $user->locale = 'ar';
        // Google asserts the address is verified, which is exactly what the
        // application's own verification step establishes.
        $user->email_verified_at = now();
        $user->save();

        return $user->load('role');
    }

    /** Refreshes cheap profile data without overwriting anything the user set here. */
    private function touchProfile(User $user, SocialiteUser $googleUser): User
    {
        $avatar = $this->avatarUrl($googleUser);

        if ($avatar !== null) {
            $user->google_avatar_url = $avatar;
        }

        if ($user->email_verified_at === null) {
            $user->email_verified_at = now();
        }

        $user->save();

        return $user->load('role');
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(SocialiteUser $googleUser, string $email): array
    {
        $raw = $googleUser->getName() ?? $googleUser->getNickname() ?? '';
        $parts = preg_split('/\s+/u', trim((string) $raw), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            // Fall back to the local part of the address so the NOT NULL name
            // columns are always satisfied.
            $local = Str::before($email, '@');

            return [Str::limit($local, 100, ''), '-'];
        }

        $first = array_shift($parts);
        $last = $parts === [] ? '-' : implode(' ', $parts);

        return [Str::limit($first, 100, ''), Str::limit($last, 100, '')];
    }

    private function avatarUrl(SocialiteUser $googleUser): ?string
    {
        $avatar = $googleUser->getAvatar();

        if (! is_string($avatar) || $avatar === '') {
            return null;
        }

        // Only accept an absolute https URL on a Google-controlled host, so a
        // malformed provider response cannot inject an arbitrary remote URL
        // into a field the frontend renders.
        $host = parse_url($avatar, PHP_URL_HOST);
        $scheme = parse_url($avatar, PHP_URL_SCHEME);

        if ($scheme !== 'https' || ! is_string($host)) {
            return null;
        }

        $allowed = $host === 'lh3.googleusercontent.com'
            || str_ends_with($host, '.googleusercontent.com')
            || str_ends_with($host, '.google.com');

        return $allowed ? Str::limit($avatar, 500, '') : null;
    }

    /** Stores the issued token behind a single-use code and returns the code. */
    public function stashClaim(array $result): string
    {
        $code = Str::random(64);

        Cache::put(self::CLAIM_PREFIX.hash('sha256', $code), [
            'token' => $result['token'],
            'token_type' => $result['token_type'],
            'user_id' => $result['user']->id,
        ], now()->addSeconds(self::CLAIM_TTL_SECONDS));

        return $code;
    }

    /** Redeems a claim code exactly once. Returns null when unknown or expired. */
    public function redeemClaim(string $code): ?array
    {
        $key = self::CLAIM_PREFIX.hash('sha256', $code);
        $payload = Cache::pull($key);

        if (! is_array($payload) || ! isset($payload['token'], $payload['user_id'])) {
            return null;
        }

        $user = User::query()->with('role')->find($payload['user_id']);

        if ($user === null || $user->status !== 'active') {
            return null;
        }

        return [
            'user' => $user,
            'token' => $payload['token'],
            'token_type' => $payload['token_type'] ?? 'Bearer',
        ];
    }
}
