<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationManagementApiTest extends TestCase
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

    private function makeUser(string $roleSlug, string $email): User
    {
        $user = User::create([
            'role_id' => Role::where('slug', $roleSlug)->firstOrFail()->id,
            'first_name' => ucfirst($roleSlug),
            'last_name' => 'Test',
            'email' => $email,
            'password' => 'Str0ng!Password',
            'status' => 'active',
            'locale' => 'ar',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    private function makeDonation(array $overrides = []): Donation
    {
        static $seq = 0;
        $seq++;

        return Donation::create(array_merge([
            'donor_name' => 'Donor '.$seq,
            'donor_email' => "donor{$seq}@example.com",
            'donor_phone' => '+96279000000'.$seq,
            'amount' => 50,
            'currency' => 'JOD',
            'status' => 'pending',
            'payment_provider' => 'card',
            'payment_reference' => 'TXN-'.str_pad((string) $seq, 6, '0', STR_PAD_LEFT),
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $donation = $this->makeDonation();

        $this->getJson('/api/v1/donations')->assertStatus(401);

        // Regular members are fully locked out.
        $this->getJson('/api/v1/donations', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();

        // Moderators can view but cannot change state.
        $this->getJson('/api/v1/donations', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/donations/{$donation->id}", $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->patchJson("/api/v1/donations/{$donation->id}/status", ['status' => 'completed'], $this->headers($this->moderator))
            ->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->patchJson("/api/v1/donations/{$donation->id}/cancel", [], $this->headers($this->moderator))
            ->assertStatus(403);
        $this->app['auth']->forgetGuards();

        // Admins have full access.
        $this->getJson('/api/v1/donations', $this->headers($this->admin))->assertOk();
    }

    public function test_resource_shape_maps_database_fields(): void
    {
        $donation = $this->makeDonation(['status' => 'paid', 'amount' => 120.50, 'notes' => 'internal note']);

        $this->getJson("/api/v1/donations/{$donation->id}", $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.donor_name', $donation->donor_name)
            ->assertJsonPath('data.email', $donation->donor_email)
            ->assertJsonPath('data.phone', $donation->donor_phone)
            ->assertJsonPath('data.amount', 120.5)
            ->assertJsonPath('data.currency', 'JOD')
            ->assertJsonPath('data.method', 'card')
            ->assertJsonPath('data.transaction_id', $donation->payment_reference)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.notes', 'internal note');
    }

    public function test_list_search_filters_pagination(): void
    {
        $this->makeDonation(['donor_name' => 'Ahmad Alpha', 'payment_provider' => 'card', 'status' => 'paid']);
        $this->makeDonation(['donor_name' => 'Basel Beta', 'donor_email' => 'basel@example.org', 'payment_provider' => 'paypal', 'status' => 'pending']);
        $this->makeDonation(['donor_name' => 'Carim Gamma', 'payment_provider' => 'cash', 'status' => 'refunded', 'payment_reference' => 'TXN-SPECIAL']);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/donations?search=alpha', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.donor_name', 'Ahmad Alpha');

        $this->getJson('/api/v1/donations?search=basel@example.org', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/donations?search=TXN-SPECIAL', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.donor_name', 'Carim Gamma');

        $this->getJson('/api/v1/donations?status=completed', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'completed');

        $this->getJson('/api/v1/donations?method=paypal', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $today = now()->toDateString();
        $this->getJson("/api/v1/donations?date_from={$today}&date_to={$today}", $headers)
            ->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/donations?date_to=2000-01-01', $headers)
            ->assertOk()->assertJsonCount(0, 'data');

        $this->getJson('/api/v1/donations?per_page=2&page=2', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);

        // Invalid enum filters are rejected; malformed dates (mid-typing
        // in the UI's native date inputs) are ignored, not rejected.
        $this->getJson('/api/v1/donations?status=bogus', $headers)->assertStatus(422);
        $this->getJson('/api/v1/donations?date_from=13-2026-01', $headers)
            ->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/donations?date_from=0002-08-11&date_to=2026-08-119', $headers)
            ->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_statistics(): void
    {
        $this->makeDonation(['status' => 'paid', 'amount' => 100, 'donor_email' => 'a@example.com']);
        $this->makeDonation(['status' => 'paid', 'amount' => 40, 'donor_email' => 'a@example.com']);
        $this->makeDonation(['status' => 'pending', 'amount' => 25, 'donor_email' => 'b@example.com']);
        $this->makeDonation(['status' => 'failed', 'amount' => 999, 'donor_email' => 'c@example.com']);
        $this->makeDonation(['status' => 'cancelled', 'amount' => 500, 'donor_email' => 'd@example.com']);

        // A completed donation from a previous month is excluded from
        // this month's total but included in the overall totals.
        $old = $this->makeDonation(['status' => 'paid', 'amount' => 60, 'donor_email' => 'e@example.com']);
        Donation::whereKey($old->id)->update(['created_at' => now()->subMonths(2)]);

        $this->getJson('/api/v1/donations/statistics', $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.total_amount', 225)   // 100+40+25+60
            ->assertJsonPath('data.completed_amount', 200) // 100+40+60
            ->assertJsonPath('data.pending_count', 1)
            ->assertJsonPath('data.donors_count', 5)
            ->assertJsonPath('data.this_month_amount', 140) // 100+40
            ->assertJsonPath('data.currency', 'JOD');
    }

    public function test_valid_status_transitions(): void
    {
        $headers = $this->headers($this->admin);

        $pending = $this->makeDonation();
        $this->patchJson("/api/v1/donations/{$pending->id}/status", ['status' => 'completed'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertNotNull($pending->fresh()->paid_at);

        $pending2 = $this->makeDonation();
        $this->patchJson("/api/v1/donations/{$pending2->id}/status", ['status' => 'failed'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'failed');

        $this->patchJson("/api/v1/donations/{$pending->id}/refund", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'refunded');
        $this->assertNotNull($pending->fresh()->refunded_at);

        $pending3 = $this->makeDonation();
        $this->patchJson("/api/v1/donations/{$pending3->id}/cancel", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'cancelled');
    }

    public function test_invalid_status_transitions_rejected(): void
    {
        $headers = $this->headers($this->admin);

        $refunded = $this->makeDonation(['status' => 'refunded']);
        // Refunding an already refunded donation.
        $this->patchJson("/api/v1/donations/{$refunded->id}/refund", [], $headers)->assertStatus(422);
        // Cancelling an already refunded donation.
        $this->patchJson("/api/v1/donations/{$refunded->id}/cancel", [], $headers)->assertStatus(422);
        // Completing a refunded donation.
        $this->patchJson("/api/v1/donations/{$refunded->id}/status", ['status' => 'completed'], $headers)->assertStatus(422);

        $cancelled = $this->makeDonation(['status' => 'cancelled']);
        // Completing a cancelled donation.
        $this->patchJson("/api/v1/donations/{$cancelled->id}/status", ['status' => 'completed'], $headers)->assertStatus(422);
        // Refunding a pending donation.
        $pending = $this->makeDonation();
        $this->patchJson("/api/v1/donations/{$pending->id}/refund", [], $headers)->assertStatus(422);
        // Invalid status value.
        $this->patchJson("/api/v1/donations/{$pending->id}/status", ['status' => 'refunded'], $headers)->assertStatus(422);

        // States are unchanged after the rejected calls.
        $this->assertSame('refunded', $refunded->fresh()->status);
        $this->assertSame('cancelled', $cancelled->fresh()->status);
        $this->assertSame('pending', $pending->fresh()->status);
    }
}
