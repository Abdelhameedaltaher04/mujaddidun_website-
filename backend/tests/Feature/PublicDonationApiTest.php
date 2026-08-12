<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicDonationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'donor_name' => 'متبرع كريم',
            'donor_email' => 'donor@example.com',
            'donor_phone' => '+962791234567',
            'amount' => 50,
            'donation_type' => 'feeding',
            'frequency' => 'once',
        ], $overrides);
    }

    public function test_public_donation_creates_pending_record(): void
    {
        $response = $this->postJson('/api/v1/public/donations', $this->validPayload())
            ->assertCreated();

        $data = $response->json('data');
        $this->assertSame('pending', $data['status']);
        $this->assertEquals(50, $data['amount']);
        $this->assertSame('JOD', $data['currency']);
        foreach (['donor_email', 'donor_phone', 'notes', 'payment_reference', 'user_id'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $data);
        }

        $this->assertDatabaseHas('donations', [
            'id' => $data['id'],
            'donor_name' => 'متبرع كريم',
            'donor_email' => 'donor@example.com',
            'donor_phone' => '+962791234567',
            'currency' => 'JOD',
            'donation_type' => 'feeding',
            'frequency' => 'once',
            'status' => 'pending',
        ]);
    }

    public function test_client_cannot_set_status_payment_fields_or_currency(): void
    {
        $response = $this->postJson('/api/v1/public/donations', $this->validPayload([
            'status' => 'paid',
            'payment_provider' => 'evil',
            'payment_reference' => 'FAKE-123',
            'currency' => 'USD',
            'paid_at' => now()->toISOString(),
            'notes' => 'injected',
        ]))->assertCreated();

        $donation = Donation::findOrFail($response->json('data.id'));
        $this->assertSame('pending', $donation->status);
        $this->assertNull($donation->payment_provider);
        $this->assertNull($donation->payment_reference);
        $this->assertSame('JOD', $donation->currency);
        $this->assertNull($donation->paid_at);
        $this->assertNull($donation->notes);
    }

    public function test_validation_rejects_bad_input(): void
    {
        // Missing phone, bad email, zero/negative/non-numeric amounts, bad enums.
        $this->postJson('/api/v1/public/donations', $this->validPayload(['donor_phone' => '']))
            ->assertStatus(422)->assertJsonValidationErrors(['donor_phone']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['donor_email' => 'not-an-email']))
            ->assertStatus(422)->assertJsonValidationErrors(['donor_email']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['amount' => 0]))
            ->assertStatus(422)->assertJsonValidationErrors(['amount']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['amount' => -5]))
            ->assertStatus(422)->assertJsonValidationErrors(['amount']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['amount' => 'abc']))
            ->assertStatus(422)->assertJsonValidationErrors(['amount']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['amount' => 10000000]))
            ->assertStatus(422)->assertJsonValidationErrors(['amount']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['donation_type' => 'invalid']))
            ->assertStatus(422)->assertJsonValidationErrors(['donation_type']);
        $this->postJson('/api/v1/public/donations', $this->validPayload(['frequency' => 'weekly']))
            ->assertStatus(422)->assertJsonValidationErrors(['frequency']);
        // Honeypot filled => rejected.
        $this->postJson('/api/v1/public/donations', $this->validPayload(['website' => 'spam.com']))
            ->assertStatus(422)->assertJsonValidationErrors(['website']);

        $this->assertDatabaseCount('donations', 0);
    }

    public function test_donation_appears_in_admin_list(): void
    {
        $id = $this->postJson('/api/v1/public/donations', $this->validPayload())->json('data.id');

        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'admin')->first()->id,
        ]);
        $token = $admin->createToken('t')->plainTextToken;

        $list = $this->getJson('/api/v1/donations?search=donor@example.com', [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk()->json('data');
        $this->assertContains($id, array_column($list, 'id'));

        $row = collect($list)->firstWhere('id', $id);
        $this->assertSame('pending', $row['status']);
        $this->assertEquals(50, $row['amount']);
    }
}
