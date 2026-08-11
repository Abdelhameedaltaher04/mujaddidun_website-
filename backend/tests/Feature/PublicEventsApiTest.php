<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEventsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->member = User::factory()->create([
            'role_id' => Role::where('slug', 'volunteer')->first()->id,
        ]);
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('t')->plainTextToken];
    }

    private function makeEvent(array $overrides = []): Event
    {
        return Event::create(array_merge([
            'title_ar' => 'فعالية', 'title_en' => 'Event', 'slug' => 'e-'.uniqid(),
            'excerpt_ar' => 'نبذة', 'excerpt_en' => 'excerpt',
            'description_ar' => 'وصف', 'description_en' => 'description',
            'location_ar' => 'عمان', 'location_en' => 'Amman',
            'starts_at' => now()->addDays(7), 'ends_at' => now()->addDays(7)->addHours(3),
            'registration_required' => true, 'registration_status' => 'open',
            'status' => 'upcoming',
        ], $overrides));
    }

    public function test_list_exposes_only_public_statuses(): void
    {
        $upcoming = $this->makeEvent();
        $completed = $this->makeEvent(['status' => 'completed', 'starts_at' => now()->subDays(10)]);
        $this->makeEvent(['status' => 'draft']);
        $this->makeEvent(['status' => 'cancelled']);

        $data = $this->getJson('/api/v1/public/events')->assertOk()->json('data');
        $this->assertEqualsCanonicalizing(
            [$upcoming->id, $completed->id],
            array_column($data, 'id'),
        );

        // No admin/private fields leak.
        $first = $data[0];
        foreach (['created_by', 'registration_starts_at', 'registration_ends_at', 'registrations'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $first);
        }
    }

    public function test_status_filter_and_pagination(): void
    {
        foreach (range(1, 3) as $i) {
            $this->makeEvent(['starts_at' => now()->addDays($i)]);
        }
        $this->makeEvent(['status' => 'completed', 'starts_at' => now()->subDay()]);

        $upcoming = $this->getJson('/api/v1/public/events?status=upcoming,ongoing')->assertOk()->json();
        $this->assertSame(3, $upcoming['meta']['total']);

        $completed = $this->getJson('/api/v1/public/events?status=completed')->assertOk()->json();
        $this->assertSame(1, $completed['meta']['total']);

        $page = $this->getJson('/api/v1/public/events?status=upcoming&per_page=2&page=2')->assertOk()->json();
        $this->assertSame(2, $page['meta']['current_page']);
        $this->assertSame(2, $page['meta']['last_page']);
        $this->assertCount(1, $page['data']);

        $this->getJson('/api/v1/public/events?status=draft')->assertStatus(422);
    }

    public function test_detail_shape_and_hidden_statuses_return_404(): void
    {
        $event = $this->makeEvent(['capacity' => 10]);
        $event->registrations()->create([
            'user_id' => null, 'registration_reference' => 'r1',
            'full_name' => 'Guest', 'email' => 'g@example.com',
            'status' => 'pending', 'registered_at' => now(),
        ]);

        $data = $this->getJson("/api/v1/public/events/{$event->id}")->assertOk()->json('data');
        $this->assertSame('فعالية', $data['title_ar']);
        $this->assertSame('وصف', $data['description_ar']);
        $this->assertTrue($data['registration_open']);
        $this->assertSame(10, $data['capacity']);
        $this->assertSame(1, $data['registered_count']);
        $this->assertSame(9, $data['available_spots']);
        $this->assertFalse($data['is_registered']);

        $draft = $this->makeEvent(['status' => 'draft']);
        $cancelled = $this->makeEvent(['status' => 'cancelled']);
        $this->getJson("/api/v1/public/events/{$draft->id}")->assertNotFound();
        $this->getJson("/api/v1/public/events/{$cancelled->id}")->assertNotFound();
    }

    public function test_is_registered_flag_for_authenticated_user(): void
    {
        $event = $this->makeEvent();
        $headers = $this->headers($this->member);

        $before = $this->getJson("/api/v1/public/events/{$event->id}", $headers)->json('data');
        $this->assertFalse($before['is_registered']);

        $this->postJson("/api/v1/public/events/{$event->id}/register", [], $headers)->assertStatus(201);

        $after = $this->getJson("/api/v1/public/events/{$event->id}", $headers)->json('data');
        $this->assertTrue($after['is_registered']);
        $this->assertSame(1, $after['registered_count']);
    }

    public function test_event_cover_files_hidden_for_draft_and_cancelled_events(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        $disk->put('event-covers/public.jpg', 'x');
        $disk->put('event-covers/draft.jpg', 'x');

        $this->makeEvent(['cover_image_path' => 'event-covers/public.jpg']);
        $this->makeEvent(['status' => 'draft', 'cover_image_path' => 'event-covers/draft.jpg']);

        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'admin')->first()->id,
        ]);

        // Public cover: served and publicly cacheable.
        $this->get('/api/v1/files/event-covers/public.jpg')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=86400, public');

        // Draft cover: hidden from the public, staff preview is uncacheable.
        $this->get('/api/v1/files/event-covers/draft.jpg')->assertNotFound();
        $this->get('/api/v1/files/event-covers/draft.jpg', $this->headers($this->member))->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->get('/api/v1/files/event-covers/draft.jpg', $this->headers($admin))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_public_registration_guards_and_error_codes(): void
    {
        $event = $this->makeEvent();
        $headers = $this->headers($this->member);

        // Unauthenticated.
        $this->postJson("/api/v1/public/events/{$event->id}/register")->assertStatus(401);

        // Success then duplicate.
        $this->postJson("/api/v1/public/events/{$event->id}/register", [], $headers)->assertStatus(201);
        $this->postJson("/api/v1/public/events/{$event->id}/register", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'already_registered');

        // Closed registration.
        $closed = $this->makeEvent(['registration_status' => 'closed']);
        $this->postJson("/api/v1/public/events/{$closed->id}/register", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'closed');

        // Full event.
        $full = $this->makeEvent(['capacity' => 1]);
        $full->registrations()->create([
            'user_id' => null, 'registration_reference' => 'r2',
            'full_name' => 'Other', 'email' => 'other@example.com',
            'status' => 'pending', 'registered_at' => now(),
        ]);
        $this->postJson("/api/v1/public/events/{$full->id}/register", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'full');
    }
}
