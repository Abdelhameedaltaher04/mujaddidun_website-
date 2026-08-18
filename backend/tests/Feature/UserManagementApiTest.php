<?php

namespace Tests\Feature;

use App\Mail\AccountActivatedMail;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $moderator;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = $this->makeUser('admin', 'admin@example.com');
        $this->moderator = $this->makeUser('moderator', 'moderator@example.com');
        $this->member = $this->makeUser('user', 'member@example.com');
    }

    private function makeUser(string $roleSlug, string $email, array $extra = []): User
    {
        $user = User::create(array_merge([
            'role_id' => Role::where('slug', $roleSlug)->firstOrFail()->id,
            'first_name' => ucfirst($roleSlug),
            'last_name' => 'Test',
            'email' => $email,
            'password' => 'Str0ng!Password',
            'status' => 'active',
            'locale' => 'ar',
        ], $extra));

        // Not mass-assignable by design.
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }

    private function actingAsToken(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_unauthenticated_requests_receive_401(): void
    {
        $this->getJson('/api/v1/users')->assertStatus(401);
    }

    public function test_regular_users_receive_403(): void
    {
        $this->getJson('/api/v1/users', $this->actingAsToken($this->member))
            ->assertStatus(403);
    }

    public function test_admin_can_list_users_with_envelope_and_meta(): void
    {
        $this->getJson('/api/v1/users?per_page=2', $this->actingAsToken($this->admin))
            ->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success', 'message',
                'data' => [['id', 'role' => ['id', 'name', 'slug'], 'first_name', 'email', 'status']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total', 'from', 'to'],
            ])
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_moderator_can_read_but_not_mutate(): void
    {
        $headers = $this->actingAsToken($this->moderator);

        $this->getJson('/api/v1/users', $headers)->assertStatus(200);
        $this->getJson('/api/v1/users/'.$this->member->id, $headers)->assertStatus(200);

        $this->patchJson("/api/v1/users/{$this->member->id}/status", ['status' => 'suspended'], $headers)
            ->assertStatus(403);
        $this->patchJson("/api/v1/users/{$this->member->id}/role", ['role' => 'volunteer'], $headers)
            ->assertStatus(403);
        $this->deleteJson('/api/v1/users/'.$this->member->id, [], $headers)
            ->assertStatus(403)
            ->assertJson(['success' => false]);
    }

    public function test_search_and_filters(): void
    {
        $headers = $this->actingAsToken($this->admin);

        $this->getJson('/api/v1/users?search=member', $headers)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.email', 'member@example.com');

        // LIKE wildcards must be treated literally.
        $this->getJson('/api/v1/users?search=%', $headers)
            ->assertJsonPath('meta.total', 0);

        $this->getJson('/api/v1/users?role=moderator', $headers)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.role.slug', 'moderator');

        $this->member->forceFill(['email_verified_at' => null])->save();
        $this->getJson('/api/v1/users?verified=unverified', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/users?status=suspended', $headers)
            ->assertJsonPath('meta.total', 0);
    }

    public function test_admin_can_update_user(): void
    {
        $this->putJson('/api/v1/users/'.$this->member->id, [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'phone' => '+962791111111',
            'role' => 'volunteer',
            'status' => 'active',
        ], $this->actingAsToken($this->admin))
            ->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Updated')
            ->assertJsonPath('data.role.slug', 'volunteer');
    }

    public function test_validation_errors_use_envelope(): void
    {
        $this->putJson('/api/v1/users/'.$this->member->id, [
            'first_name' => '',
            'last_name' => 'x',
            'phone' => null,
            'role' => 'bogus',
            'status' => 'pending',
        ], $this->actingAsToken($this->admin))
            ->assertStatus(422)
            ->assertJson(['success' => false, 'message' => 'Validation failed.'])
            ->assertJsonStructure(['errors' => ['first_name', 'role', 'status']]);
    }

    public function test_suspending_revokes_tokens(): void
    {
        $memberToken = $this->actingAsToken($this->member);
        $this->getJson('/api/v1/auth/me', $memberToken)->assertStatus(200);

        // The guard caches the resolved user between in-test requests.
        $this->app['auth']->forgetGuards();

        $this->patchJson(
            "/api/v1/users/{$this->member->id}/status",
            ['status' => 'suspended'],
            $this->actingAsToken($this->admin),
        )->assertStatus(200)->assertJsonPath('data.status', 'suspended');

        $this->assertSame(0, $this->member->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/me', $memberToken)->assertStatus(401);
    }

    public function test_activating_a_suspended_account_sends_one_activation_email(): void
    {
        Mail::fake();
        $client = $this->makeUser('user', 'client@example.com', ['status' => 'suspended']);

        $this->patchJson(
            "/api/v1/users/{$client->id}/status",
            ['status' => 'active'],
            $this->actingAsToken($this->admin),
        )->assertStatus(200)->assertJsonPath('data.status', 'active');

        $this->assertSame('active', $client->fresh()->status);

        Mail::assertSent(AccountActivatedMail::class, 1);
        Mail::assertSent(
            AccountActivatedMail::class,
            fn (AccountActivatedMail $mail) => $mail->hasTo('client@example.com'),
        );
    }

    public function test_reactivating_an_already_active_account_sends_no_email(): void
    {
        Mail::fake();

        $this->patchJson(
            "/api/v1/users/{$this->member->id}/status",
            ['status' => 'active'],
            $this->actingAsToken($this->admin),
        )->assertStatus(200);

        Mail::assertNothingSent();
    }

    public function test_suspending_an_account_sends_no_activation_email(): void
    {
        Mail::fake();

        $this->patchJson(
            "/api/v1/users/{$this->member->id}/status",
            ['status' => 'suspended'],
            $this->actingAsToken($this->admin),
        )->assertStatus(200);

        Mail::assertNothingSent();
    }

    public function test_non_admins_cannot_activate_and_no_email_is_sent(): void
    {
        Mail::fake();
        $client = $this->makeUser('user', 'client2@example.com', ['status' => 'suspended']);

        $this->patchJson(
            "/api/v1/users/{$client->id}/status",
            ['status' => 'active'],
            $this->actingAsToken($this->moderator),
        )->assertStatus(403);

        $this->assertSame('suspended', $client->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_activation_email_is_localised_and_leaks_no_credentials(): void
    {
        $arabic = $this->makeUser('user', 'ar-client@example.com', ['status' => 'suspended', 'locale' => 'ar']);
        $english = $this->makeUser('user', 'en-client@example.com', ['status' => 'suspended', 'locale' => 'en']);

        $arabicMail = new AccountActivatedMail($arabic);
        $this->assertSame('تم تفعيل حسابك في منصة مجددون', $arabicMail->envelope()->subject);
        $arabicHtml = $arabicMail->render();
        $this->assertStringContainsString('dir="rtl"', $arabicHtml);
        $this->assertStringContainsString('/login', $arabicHtml);
        $this->assertStringNotContainsString('Str0ng!Password', $arabicHtml);

        $englishMail = new AccountActivatedMail($english);
        $this->assertSame('Your Mujaddidun account has been activated', $englishMail->envelope()->subject);
        $this->assertStringContainsString('dir="ltr"', $englishMail->render());
    }

    public function test_self_action_guards(): void
    {
        $headers = $this->actingAsToken($this->admin);
        $id = $this->admin->id;

        $this->patchJson("/api/v1/users/{$id}/status", ['status' => 'suspended'], $headers)
            ->assertStatus(422);
        $this->patchJson("/api/v1/users/{$id}/role", ['role' => 'user'], $headers)
            ->assertStatus(422);
        $this->deleteJson("/api/v1/users/{$id}", [], $headers)
            ->assertStatus(422);
    }

    public function test_delete_soft_deletes_frees_email_and_hides_user(): void
    {
        $headers = $this->actingAsToken($this->admin);

        $this->deleteJson('/api/v1/users/'.$this->member->id, [], $headers)
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->getJson('/api/v1/users/'.$this->member->id, $headers)->assertStatus(404);
        $this->getJson('/api/v1/users?search=member', $headers)->assertJsonPath('meta.total', 0);

        $this->assertSoftDeleted('users', ['id' => $this->member->id]);

        // The original email is freed for future registration.
        $this->assertDatabaseMissing('users', ['email' => 'member@example.com']);
        $trashed = User::withTrashed()->find($this->member->id);
        $this->assertStringStartsWith('member@example.com.deleted.', $trashed->email);
    }
}
