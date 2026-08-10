<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_a_user_can_register_and_receives_a_verification_email_without_a_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Abood',
            'last_name' => 'Majed',
            'email' => 'abood@example.com',
            'phone' => '+962791234567',
            'country_code' => 'jo',
            'password' => 'StrongPassword1!',
            'password_confirmation' => 'StrongPassword1!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'abood@example.com')
            ->assertJsonPath('data.user.role.slug', 'user')
            ->assertJsonPath('data.email_verification_required', true)
            ->assertJsonMissingPath('data.token');

        $this->assertDatabaseHas('users', [
            'email' => 'abood@example.com',
            'country_code' => 'JO',
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email_verified_at' => null,
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        Notification::assertSentTo(
            User::where('email', 'abood@example.com')->first(),
            \Illuminate\Auth\Notifications\VerifyEmail::class,
        );
    }

    public function test_registration_validation_is_returned_in_the_standard_format(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'not-an-email',
            'password' => 'short',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed.')
            ->assertJsonStructure(['errors' => ['first_name', 'last_name', 'email', 'phone']]);
    }

    public function test_duplicate_email_registration_is_rejected(): void
    {
        User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Existing',
            'last_name' => 'User',
            'email' => 'EXISTING@example.com',
            'phone' => '+962791234567',
            'country_code' => 'JO',
            'password' => 'StrongPassword1!',
            'password_confirmation' => 'StrongPassword1!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.email.0', 'The email has already been taken.');
    }

    public function test_a_user_can_login_view_their_profile_and_logout(): void
    {
        $user = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'login@example.com',
            'password' => Hash::make('StrongPassword1!'),
            'status' => 'active',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'LOGIN@example.com',
            'password' => 'StrongPassword1!',
        ]);

        $login->assertOk()->assertJsonPath('data.user.email', 'login@example.com');
        $token = $login->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_a_suspended_users_existing_token_is_rejected_and_revoked(): void
    {
        $user = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'suspended-token@example.com',
            'password' => Hash::make('StrongPassword1!'),
            'status' => 'active',
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'suspended-token@example.com',
            'password' => 'StrongPassword1!',
        ])->json('data.token');

        $user->forceFill(['status' => 'suspended'])->save();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertForbidden()
            ->assertJsonPath('errors.code.0', 'account_disabled');

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // The revoked token stays dead even after re-activation.
        $user->forceFill(['status' => 'active'])->save();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_inactive_users_cannot_login(): void
    {
        User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'inactive@example.com',
            'password' => Hash::make('StrongPassword1!'),
            'status' => 'suspended',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'StrongPassword1!',
        ])
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.code.0', 'account_disabled');
    }

    public function test_unverified_users_cannot_login(): void
    {
        User::factory()->unverified()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'unverified@example.com',
            'password' => Hash::make('StrongPassword1!'),
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'unverified@example.com',
            'password' => 'StrongPassword1!',
        ])
            ->assertForbidden()
            ->assertJsonPath('errors.code.0', 'email_not_verified');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_a_signed_verification_link_marks_the_user_verified(): void
    {
        $user = User::factory()->unverified()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'verify@example.com',
        ]);

        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->email),
            ],
        );

        $this->getJson(parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'verify@example.com');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_resend_is_throttled(): void
    {
        Notification::fake();

        User::factory()->unverified()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'resend@example.com',
        ]);

        $payload = ['email' => 'resend@example.com'];

        $this->postJson('/api/v1/auth/email/resend', $payload)
            ->assertOk()
            ->assertJsonPath('data.email_verification_sent', true);

        $this->postJson('/api/v1/auth/email/resend', $payload)
            ->assertStatus(429)
            ->assertJsonPath('success', false);
    }

    public function test_a_password_can_be_reset_with_a_valid_broker_token(): void
    {
        $user = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'reset@example.com',
            'password' => Hash::make('OldPassword1!'),
        ]);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reset@example.com',
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'reset@example.com',
            'password' => 'NewPassword1!',
        ])->assertOk();
    }

    public function test_an_authenticated_user_can_view_and_update_their_profile(): void
    {
        Storage::fake('public');
        $user = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'first_name' => 'Old',
            'last_name' => 'Name',
            'email' => 'profile@example.com',
            'phone' => '+962791234567',
            'country_code' => 'JO',
        ]);

        $token = $user->createToken('profile-test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'profile@example.com')
            ->assertJsonPath('data.user.role.slug', 'user');

        $avatar = UploadedFile::fake()->image('avatar.webp', 200, 200);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/v1/profile', [
                'first_name' => 'Updated',
                'last_name' => 'Member',
                'phone' => '+966501234567',
                'country_code' => 'SA',
                'avatar' => $avatar,
            ])
            ->assertOk()
            ->assertJsonPath('data.user.first_name', 'Updated')
            ->assertJsonPath('data.user.country_code', 'SA')
            ->assertJsonPath('data.user.avatar_path', fn ($path) => is_string($path));

        $updated = $user->fresh();
        $this->assertSame('Updated', $updated->first_name);
        $this->assertSame('SA', $updated->country_code);
        Storage::disk('public')->assertExists($updated->avatar_path);
    }

    public function test_an_authenticated_user_must_provide_the_current_password_to_change_it(): void
    {
        $user = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->value('id'),
            'email' => 'profile-password@example.com',
            'password' => Hash::make('CurrentPassword1!'),
        ]);
        $token = $user->createToken('profile-password-test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profile/password', [
                'current_password' => 'WrongPassword1!',
                'new_password' => 'NewPassword1!',
                'password_confirmation' => 'NewPassword1!',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.current_password.0', 'The current password is incorrect.');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profile/password', [
                'current_password' => 'CurrentPassword1!',
                'new_password' => 'NewPassword1!',
                'password_confirmation' => 'NewPassword1!',
            ])
            ->assertOk();
    }
}