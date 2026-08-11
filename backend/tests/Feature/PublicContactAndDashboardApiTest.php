<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Donation;
use App\Models\News;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class PublicContactAndDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear(sha1('throttle:5,1'.request()->ip()));
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'زائر الموقع',
            'email' => 'visitor@example.com',
            'phone' => '+962790001122',
            'subject' => 'استفسار عام',
            'message' => 'أرغب بمعرفة المزيد عن برامج التطوع.',
        ], $overrides);
    }

    public function test_public_contact_form_stores_message_as_new(): void
    {
        $response = $this->postJson('/api/v1/public/contact-messages', $this->validPayload());

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('contact_messages', [
            'email' => 'visitor@example.com',
            'status' => 'new',
            'read_at' => null,
        ]);
        $message = ContactMessage::firstWhere('email', 'visitor@example.com');
        $this->assertNotNull($message->created_at);
    }

    public function test_public_contact_validation_field_errors(): void
    {
        $this->postJson('/api/v1/public/contact-messages', $this->validPayload([
            'email' => 'not-an-email',
        ]))->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->postJson('/api/v1/public/contact-messages', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);

        // Phone is optional but validated when present.
        $this->postJson('/api/v1/public/contact-messages', $this->validPayload([
            'phone' => 'abc',
        ]))->assertStatus(422)->assertJsonValidationErrors(['phone']);

        // Honeypot: bots that fill the hidden field are rejected.
        $this->postJson('/api/v1/public/contact-messages', $this->validPayload([
            'website' => 'https://spam.example',
        ]))->assertStatus(422)->assertJsonValidationErrors(['website']);

        $this->assertSame(0, ContactMessage::count());
    }

    public function test_public_contact_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/public/contact-messages', $this->validPayload([
                'email' => "visitor{$i}@example.com",
            ]))->assertStatus(201);
        }

        $this->postJson('/api/v1/public/contact-messages', $this->validPayload())
            ->assertStatus(429);
    }

    public function test_stored_public_message_appears_in_admin_inbox(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create(['role_id' => Role::where('slug', 'admin')->first()->id]);

        $this->postJson('/api/v1/public/contact-messages', $this->validPayload())->assertStatus(201);

        $token = $admin->createToken('t')->plainTextToken;
        $list = $this->getJson('/api/v1/contact-messages', ['Authorization' => "Bearer {$token}"])->assertOk();
        $this->assertSame('استفسار عام', $list->json('data.0.subject'));
        $this->assertSame('new', $list->json('data.0.status'));
    }

    public function test_public_settings_alias_matches_sanitized_output(): void
    {
        $alias = $this->getJson('/api/v1/public/settings')->assertOk()->json('data');
        $this->assertArrayNotHasKey('email', $alias);
        $this->assertArrayHasKey('general', $alias);
        $this->assertArrayHasKey('controls', $alias);
    }

    public function test_dashboard_requires_admin(): void
    {
        $this->seed(RoleSeeder::class);

        $this->getJson('/api/v1/admin/dashboard/statistics')->assertStatus(401);

        $moderator = User::factory()->create(['role_id' => Role::where('slug', 'moderator')->first()->id]);
        $token = $moderator->createToken('t')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/dashboard/statistics', ['Authorization' => "Bearer {$token}"])->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/dashboard/charts', ['Authorization' => "Bearer {$token}"])->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/dashboard/activities', ['Authorization' => "Bearer {$token}"])->assertStatus(403);
    }

    public function test_dashboard_statistics_match_database(): void
    {
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create(['role_id' => Role::where('slug', 'admin')->first()->id]);
        $token = $admin->createToken('t')->plainTextToken;

        News::create(['title_ar' => 'أ', 'title_en' => 'A', 'slug' => 'a-'.uniqid(), 'content_ar' => 'م', 'content_en' => 'c', 'status' => 'published', 'published_at' => now()]);
        News::create(['title_ar' => 'ب', 'title_en' => 'B', 'slug' => 'b-'.uniqid(), 'content_ar' => 'م', 'content_en' => 'c', 'status' => 'draft']);
        ContactMessage::create(['name' => 'ز', 'email' => 'v@e.com', 'subject' => 'س', 'message' => 'ر', 'status' => 'new']);
        Donation::create(['donor_name' => 'م', 'amount' => 50, 'donation_type' => 'general', 'status' => 'paid', 'paid_at' => now()]);

        $stats = collect($this->getJson('/api/v1/admin/dashboard/statistics', ['Authorization' => "Bearer {$token}"])
            ->assertOk()->json('data'))->keyBy('key');

        $this->assertSame(1, $stats['users']['value']);
        $this->assertSame(1, $stats['news']['value']); // published only
        $this->assertSame(1, $stats['contactMessages']['value']);
        $this->assertSame(1, $stats['unreadMessages']['value']);
        $this->assertEquals(50, $stats['donations']['value']); // paid amount total

        $charts = $this->getJson('/api/v1/admin/dashboard/charts', ['Authorization' => "Bearer {$token}"])->assertOk()->json('data');
        $this->assertCount(6, $charts['usersGrowth']);
        $this->assertEquals(50, collect($charts['donations'])->sum('value'));

        $activities = $this->getJson('/api/v1/admin/dashboard/activities', ['Authorization' => "Bearer {$token}"])->assertOk()->json('data');
        $this->assertNotEmpty($activities);
        $types = array_column($activities, 'type');
        $this->assertContains('news_published', $types);
        $this->assertContains('donation_received', $types);
    }
}
