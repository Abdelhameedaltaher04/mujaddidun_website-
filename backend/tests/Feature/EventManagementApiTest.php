<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class EventManagementApiTest extends TestCase
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

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title_ar' => 'فعالية تجريبية',
            'title_en' => 'Test Event',
            'excerpt_ar' => 'ملخص عربي',
            'excerpt_en' => 'English excerpt',
            'description_ar' => '<p>وصف</p>',
            'description_en' => '<p>Description</p>',
            'location_ar' => 'عمان',
            'location_en' => 'Amman',
            'event_date' => now()->addDays(10)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '14:00',
            'max_participants' => 50,
            'registration_start_date' => now()->toDateString(),
            'registration_end_date' => now()->addDays(9)->toDateString(),
            'registration_status' => 'open',
            'status' => 'upcoming',
            'remove_image' => '0',
        ], $overrides);
    }

    private function makeEvent(array $overrides = []): Event
    {
        $event = new Event(array_merge([
            'title_ar' => 'فعالية',
            'title_en' => 'Existing Event',
            'excerpt_ar' => 'ملخص',
            'excerpt_en' => 'Excerpt',
            'description_ar' => '<p>a</p>',
            'description_en' => '<p>b</p>',
            'location_ar' => 'عمان',
            'location_en' => 'Amman',
            'starts_at' => now()->addDays(5)->setTime(10, 0),
            'ends_at' => now()->addDays(5)->setTime(14, 0),
            'capacity' => 2,
            'registration_status' => 'open',
            'status' => 'upcoming',
            'registration_required' => true,
        ], $overrides));
        $event->slug = 'existing-event-'.uniqid();
        $event->created_by = $this->admin->id;
        $event->save();

        return $event;
    }

    private function makeRegistration(Event $event, array $overrides = []): EventRegistration
    {
        return $event->registrations()->create(array_merge([
            'registration_reference' => (string) Str::uuid(),
            'full_name' => 'Participant '.uniqid(),
            'email' => uniqid().'@example.com',
            'phone' => '+962790000000',
            'status' => 'pending',
            'registered_at' => now(),
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/events')->assertStatus(401);
        $this->getJson('/api/v1/events', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/events', $this->headers($this->moderator))->assertStatus(200);
        $this->app['auth']->forgetGuards();

        $event = $this->makeEvent();
        $this->postJson('/api/v1/events', $this->payload(), $this->headers($this->member))->assertStatus(403);
        $this->getJson("/api/v1/events/{$event->id}/registrations", $this->headers($this->member))->assertStatus(403);

        $registration = $this->makeRegistration($event);
        $this->patchJson("/api/v1/registrations/{$registration->id}/confirm", [], $this->headers($this->member))
            ->assertStatus(403);
    }

    public function test_create_edit_and_resource_shape(): void
    {
        $headers = $this->headers($this->admin);

        $create = $this->postJson('/api/v1/events', $this->payload(), $headers)
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'upcoming')
            ->assertJsonPath('data.start_time', '10:00')
            ->assertJsonPath('data.end_time', '14:00')
            ->assertJsonPath('data.max_participants', 50)
            ->assertJsonPath('data.registration_status', 'open')
            ->assertJsonPath('data.registrations_count', 0)
            ->assertJsonPath('data.image_url', null);

        $id = $create->json('data.id');

        $this->putJson("/api/v1/events/{$id}", $this->payload([
            'title_en' => 'Renamed Event',
            'max_participants' => 80,
        ]), $headers)
            ->assertStatus(200)
            ->assertJsonPath('data.title_en', 'Renamed Event')
            ->assertJsonPath('data.max_participants', 80);
    }

    public function test_validation_rules(): void
    {
        $headers = $this->headers($this->admin);

        $this->postJson('/api/v1/events', $this->payload([
            'title_ar' => '',
            'end_time' => '09:00', // before start
            'max_participants' => 0,
            'registration_end_date' => now()->subDays(20)->toDateString(), // before start date
        ]), $headers)
            ->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonStructure(['errors' => ['title_ar', 'end_time', 'max_participants', 'registration_end_date']]);
    }

    public function test_image_upload_and_validation(): void
    {
        Storage::fake('public');
        $headers = $this->headers($this->admin) + ['Accept' => 'application/json'];

        $create = $this->post('/api/v1/events', $this->payload([
            'image' => UploadedFile::fake()->image('cover.png', 1200, 800),
        ]), $headers)->assertStatus(201);

        $url = $create->json('data.image_url');
        $this->assertStringStartsWith('/api/v1/files/event-covers/', $url);
        Storage::disk('public')->assertExists(Event::find($create->json('data.id'))->cover_image_path);

        $this->post('/api/v1/events', $this->payload([
            'image' => UploadedFile::fake()->image('big.jpg')->size(6000),
        ]), $headers)->assertStatus(422)->assertJsonStructure(['errors' => ['image']]);
    }

    public function test_list_search_filters_pagination(): void
    {
        $this->makeEvent(['title_en' => 'Ramadan Iftar', 'title_ar' => 'إفطار رمضان']);
        $this->makeEvent(['status' => 'draft', 'registration_status' => 'closed']);
        $this->makeEvent([
            'location_en' => 'Irbid',
            'location_ar' => 'إربد',
            'starts_at' => now()->addDays(30)->setTime(9, 0),
            'ends_at' => now()->addDays(30)->setTime(12, 0),
        ]);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/events?search=ramadan', $headers)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title_en', 'Ramadan Iftar');

        $this->getJson('/api/v1/events?status=draft', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/events?registration_status=closed', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/events?location=irbid', $headers)
            ->assertJsonPath('meta.total', 1);

        $from = now()->addDays(20)->toDateString();
        $this->getJson("/api/v1/events?date_from={$from}", $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/events?per_page=2&page=2', $headers)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_publish_unpublish_and_cancel(): void
    {
        $headers = $this->headers($this->admin);
        $event = $this->makeEvent(['status' => 'draft']);

        $this->patchJson("/api/v1/events/{$event->id}/publish", ['publish' => true], $headers)
            ->assertJsonPath('data.status', 'upcoming');

        $this->patchJson("/api/v1/events/{$event->id}/publish", ['publish' => false], $headers)
            ->assertJsonPath('data.status', 'draft');

        $this->patchJson("/api/v1/events/{$event->id}/cancel", [], $headers)
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.registration_status', 'closed');
    }

    public function test_registrations_list_and_status_actions(): void
    {
        $headers = $this->headers($this->moderator);
        $event = $this->makeEvent(['capacity' => 10]);
        $reg = $this->makeRegistration($event, ['full_name' => 'Ahmad Search']);
        $this->makeRegistration($event, ['status' => 'confirmed']);

        $this->getJson("/api/v1/events/{$event->id}/registrations", $headers)
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 2);

        $this->getJson("/api/v1/events/{$event->id}/registrations?search=ahmad", $headers)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.participant_name', 'Ahmad Search');

        $this->getJson("/api/v1/events/{$event->id}/registrations?status=confirmed", $headers)
            ->assertJsonPath('meta.total', 1);

        $this->patchJson("/api/v1/registrations/{$reg->id}/confirm", [], $headers)
            ->assertJsonPath('data.status', 'confirmed');
        $this->patchJson("/api/v1/registrations/{$reg->id}/attended", [], $headers)
            ->assertJsonPath('data.status', 'attended');
        $this->patchJson("/api/v1/registrations/{$reg->id}/cancel", [], $headers)
            ->assertJsonPath('data.status', 'cancelled');
        $this->assertNotNull($reg->fresh()->cancelled_at);
    }

    public function test_self_registration_guards(): void
    {
        $headers = $this->headers($this->member);

        // Closed switch.
        $closed = $this->makeEvent(['registration_status' => 'closed']);
        $this->postJson("/api/v1/events/{$closed->id}/register", [], $headers)->assertStatus(422);

        // Cancelled event.
        $cancelled = $this->makeEvent(['status' => 'cancelled']);
        $this->postJson("/api/v1/events/{$cancelled->id}/register", [], $headers)->assertStatus(422);

        // Registration window in the past.
        $expired = $this->makeEvent([
            'registration_starts_at' => now()->subDays(10),
            'registration_ends_at' => now()->subDay(),
        ]);
        $this->postJson("/api/v1/events/{$expired->id}/register", [], $headers)->assertStatus(422);

        // Full capacity.
        $full = $this->makeEvent(['capacity' => 1]);
        $this->makeRegistration($full);
        $this->postJson("/api/v1/events/{$full->id}/register", [], $headers)->assertStatus(422);

        // Success, then duplicate prevented.
        $open = $this->makeEvent(['capacity' => 5]);
        $this->postJson("/api/v1/events/{$open->id}/register", [], $headers)
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.email', $this->member->email);
        $this->postJson("/api/v1/events/{$open->id}/register", [], $headers)->assertStatus(422);

        // Cancelled seats are released: cancel then register again works.
        $registration = EventRegistration::where('event_id', $open->id)->firstOrFail();
        $registration->update(['status' => 'cancelled']);
        $this->postJson("/api/v1/events/{$open->id}/register", [], $headers)->assertStatus(201);
    }

    public function test_registrations_count_excludes_cancelled(): void
    {
        $event = $this->makeEvent(['capacity' => 10]);
        $this->makeRegistration($event);
        $this->makeRegistration($event, ['status' => 'cancelled']);

        $this->getJson('/api/v1/events/'.$event->id, $this->headers($this->admin))
            ->assertJsonPath('data.registrations_count', 1);
    }

    public function test_delete_soft_deletes_and_removes_cover(): void
    {
        Storage::fake('public');
        $headers = $this->headers($this->admin);

        $create = $this->post('/api/v1/events', $this->payload([
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ]), $headers + ['Accept' => 'application/json'])->assertStatus(201);

        $id = $create->json('data.id');
        $path = Event::find($id)->cover_image_path;

        $this->deleteJson('/api/v1/events/'.$id, [], $headers)->assertStatus(200);

        $this->getJson('/api/v1/events/'.$id, $headers)->assertStatus(404);
        $this->assertSoftDeleted('events', ['id' => $id]);
        Storage::disk('public')->assertMissing($path);
    }
}
