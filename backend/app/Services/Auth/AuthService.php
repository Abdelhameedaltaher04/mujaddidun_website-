<?php

namespace App\Services\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Contracts\Auth\CanResetPassword;
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

            $token = $user->createToken($tokenName);

            return [
                'user' => $user->load('role'),
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
            ];
        });
    }

    public function login(string $email, string $password, string $tokenName = 'api-client'): ?array
    {
        $user = User::query()->with('role')->where('email', $email)->first();

        if (! $user || $user->status !== 'active' || ! Hash::check($password, $user->password)) {
            return null;
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($tokenName);

        return [
            'user' => $user->fresh('role'),
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
        ];
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