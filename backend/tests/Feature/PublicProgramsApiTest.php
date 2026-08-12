<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicProgramsApiTest extends TestCase
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

    private function makeProgram(array $overrides = []): Program
    {
        return Program::create(array_merge([
            'title_ar' => 'برنامج', 'title_en' => 'Program', 'slug' => 'p-'.uniqid(),
            'summary_ar' => 'نبذة', 'summary_en' => 'summary',
            'description_ar' => 'وصف', 'description_en' => 'description',
            'category' => 'education',
            'target_audience_ar' => 'الشباب', 'target_audience_en' => 'Youth',
            'location_ar' => 'عمان', 'location_en' => 'Amman',
            'starts_on' => now()->addDays(10)->toDateString(),
            'ends_on' => now()->addDays(40)->toDateString(),
            'objectives_ar' => 'أهداف', 'objectives_en' => 'objectives',
            'requirements_ar' => 'شروط', 'requirements_en' => 'requirements',
            'status' => 'active',
        ], $overrides));
    }

    public function test_list_exposes_only_active_and_completed(): void
    {
        $active = $this->makeProgram();
        $completed = $this->makeProgram(['status' => 'completed']);
        $this->makeProgram(['status' => 'draft']);
        $this->makeProgram(['status' => 'archived']);

        $data = $this->getJson('/api/v1/public/programs')->assertOk()->json('data');
        $this->assertEqualsCanonicalizing(
            [$active->id, $completed->id],
            array_column($data, 'id'),
        );

        // No admin/private fields leak.
        foreach (['created_by', 'participants', 'is_featured'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $data[0]);
        }
    }

    public function test_filters_and_pagination(): void
    {
        foreach (range(1, 3) as $i) {
            $this->makeProgram(['category' => 'health']);
        }
        $this->makeProgram(['category' => 'relief', 'status' => 'completed']);

        $health = $this->getJson('/api/v1/public/programs?category=health')->assertOk()->json();
        $this->assertSame(3, $health['meta']['total']);

        $completed = $this->getJson('/api/v1/public/programs?status=completed')->assertOk()->json();
        $this->assertSame(1, $completed['meta']['total']);

        $page = $this->getJson('/api/v1/public/programs?category=health&per_page=2&page=2')->assertOk()->json();
        $this->assertSame(2, $page['meta']['current_page']);
        $this->assertCount(1, $page['data']);

        $this->getJson('/api/v1/public/programs?status=draft')->assertStatus(422);
        $this->getJson('/api/v1/public/programs?category=bogus')->assertStatus(422);
    }

    public function test_staff_cannot_self_enroll_in_programs(): void
    {
        $program = $this->makeProgram();

        foreach (['admin', 'moderator'] as $slug) {
            $staff = User::factory()->create([
                'role_id' => Role::where('slug', $slug)->first()->id,
            ]);
            $this->app['auth']->forgetGuards();
            $this->postJson("/api/v1/public/programs/{$program->id}/participate", [], $this->headers($staff))
                ->assertStatus(403)
                ->assertJsonPath('errors.code', 'staff_not_allowed');
        }

        // Volunteer and regular user roles are unaffected.
        $regular = User::factory()->create([
            'role_id' => Role::where('slug', 'user')->first()->id,
        ]);
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/v1/public/programs/{$program->id}/participate", [], $this->headers($regular))
            ->assertStatus(201);
    }

    public function test_detail_shape_and_hidden_statuses_return_404(): void
    {
        $program = $this->makeProgram(['capacity' => 20]);
        $program->participants()->create([
            'user_id' => null, 'full_name' => 'Guest', 'email' => 'g@example.com',
            'status' => 'pending', 'registered_at' => now(),
        ]);

        $data = $this->getJson("/api/v1/public/programs/{$program->id}")->assertOk()->json('data');
        $this->assertSame('برنامج', $data['title_ar']);
        $this->assertSame('وصف', $data['description_ar']);
        $this->assertSame('أهداف', $data['objectives_ar']);
        $this->assertSame('شروط', $data['requirements_ar']);
        $this->assertSame('education', $data['category']);
        $this->assertTrue($data['participation_open']);
        $this->assertSame(20, $data['capacity']);
        $this->assertSame(1, $data['participants_count']);
        $this->assertSame(19, $data['available_spots']);
        $this->assertFalse($data['is_participating']);
        // Participant PII never exposed.
        $this->assertStringNotContainsString('g@example.com', json_encode($data));

        $draft = $this->makeProgram(['status' => 'draft']);
        $archived = $this->makeProgram(['status' => 'archived']);
        $this->getJson("/api/v1/public/programs/{$draft->id}")->assertNotFound();
        $this->getJson("/api/v1/public/programs/{$archived->id}")->assertNotFound();
    }

    public function test_program_cover_files_hidden_for_draft_and_archived(): void
    {
        Storage::fake('public');
        $disk = Storage::disk('public');
        $disk->put('program-covers/public.jpg', 'x');
        $disk->put('program-covers/draft.jpg', 'x');

        $this->makeProgram(['cover_image_path' => 'program-covers/public.jpg']);
        $this->makeProgram(['status' => 'draft', 'cover_image_path' => 'program-covers/draft.jpg']);

        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'admin')->first()->id,
        ]);

        $this->get('/api/v1/files/program-covers/public.jpg')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=86400, public');

        $this->get('/api/v1/files/program-covers/draft.jpg')->assertNotFound();
        $this->get('/api/v1/files/program-covers/draft.jpg', $this->headers($this->member))->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->get('/api/v1/files/program-covers/draft.jpg', $this->headers($admin))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_public_participation_guards_and_error_codes(): void
    {
        $program = $this->makeProgram();
        $headers = $this->headers($this->member);

        // Unauthenticated.
        $this->postJson("/api/v1/public/programs/{$program->id}/participate")->assertStatus(401);

        // Success then duplicate.
        $this->postJson("/api/v1/public/programs/{$program->id}/participate", [], $headers)->assertStatus(201);
        $this->postJson("/api/v1/public/programs/{$program->id}/participate", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'already_registered');

        // is_participating flag now true.
        $detail = $this->getJson("/api/v1/public/programs/{$program->id}", $headers)->json('data');
        $this->assertTrue($detail['is_participating']);
        $this->assertSame(1, $detail['participants_count']);

        // Inactive program.
        $completed = $this->makeProgram(['status' => 'completed']);
        $this->postJson("/api/v1/public/programs/{$completed->id}/participate", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'closed');

        // Full program.
        $full = $this->makeProgram(['capacity' => 1]);
        $full->participants()->create([
            'user_id' => null, 'full_name' => 'Other', 'email' => 'other@example.com',
            'status' => 'approved', 'registered_at' => now(),
        ]);
        $this->postJson("/api/v1/public/programs/{$full->id}/participate", [], $headers)
            ->assertStatus(422)
            ->assertJsonPath('errors.code', 'full');
    }
}
