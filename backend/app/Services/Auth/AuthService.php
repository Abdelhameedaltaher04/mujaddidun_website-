<?php

namespace App\Services\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function register(array $attributes, string $tokenName = 'api-client'): array
    {
        return DB::transaction(function () use ($attributes, $tokenName): array {
            $role = Role::query()->firstOrCreate(
                ['slug' => 'user'],
                [
                    'name' => 'User',
                    'description' => 'Standard authenticated member access.',
                ],
            );

            $user = User::query()->create([
                'role_id' => $role->id,
                'first_name' => $attributes['first_name'],
                'last_name' => $attributes['last_name'],
                'email' => $attributes['email'],
                'phone' => $attributes['phone'],
                'country_code' => $attributes['country_code'],
                'password' => Hash::make($attributes['password']),
                'status' => 'active',
                'locale' => 'ar',
            ]);

            event(new Registered($user));

            return [
                'user' => $user->load('role'),
            ];
        });
    }

    public function login(string $email, string $password, string $tokenName = 'api-client'): ?array
    {
        $user = User::query()->with('role')->where('email', $email)->first();

        if (! $user || $user->status !== 'active' || ! Hash::check($password, $user->password)) {
            return null;
        }

        if (! $user->hasVerifiedEmail()) {
            return ['email_not_verified' => true];
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($tokenName);

        return [
            'user' => $user->fresh('role'),
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Send a verification message without revealing whether an address exists.
     *
     * @return array{sent: bool, throttled: bool, retry_after: int}
     */
    public function resendEmailVerification(string $email): array
    {
        $key = 'email-verification-resend:'.hash('sha256', $email);
        $user = User::query()->where('email', $email)->first();

        if (! $user || $user->hasVerifiedEmail()) {
            return ['sent' => false, 'throttled' => false, 'retry_after' => 0];
        }

        if (! Cache::add($key, true, now()->addSeconds(60))) {
            return ['sent' => false, 'throttled' => true, 'retry_after' => 60];
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $exception) {
            Cache::forget($key);
            throw $exception;
        }

        return ['sent' => true, 'throttled' => false, 'retry_after' => 60];
    }

    public function logout(User $user, ?string $plainTextToken = null): void
    {
        if ($plainTextToken) {
            PersonalAccessToken::findToken($plainTextToken)?->delete();
        }

        $accessToken = $user->currentAccessToken();

        if ($accessToken instanceof PersonalAccessToken) {
            $accessToken->delete();
        }

        Auth::forgetGuards();
    }

    public function sendPasswordResetLink(string $email): string
    {
        return Password::broker()->sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $attributes): string
    {
        return Password::broker()->reset(
            [
                'email' => $attributes['email'],
                'password' => Hash::make($attributes['password']),
                'password_confirmation' => $attributes['password_confirmation'],
                'token' => $attributes['token'],
            ],
            function (CanResetPassword $user, string $password): void {
                if (! $user instanceof User) {
                    return;
                }

                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );
    }
}