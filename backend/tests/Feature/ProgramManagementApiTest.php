<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\ProgramParticipant;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProgramManagementApiTest extends TestCase
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
            'title_ar' => 'برنامج تجريبي',
            'title_en' => 'Test Program',
            'excerpt_ar' => 'ملخص عربي',
            'excerpt_en' => 'English excerpt',
            'description_ar' => '<p>وصف</p>',
            'description_en' => '<p>Description</p>',
            'category' => 'education',
            'target_audience_ar' => 'الشباب',
            'target_audience_en' => 'Youth',
            'location_ar' => 'عمان',
            'location_en' => 'Amman',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(40)->toDateString(),
            'max_participants' => 50,
            'objectives_ar' => "هدف 1\nهدف 2",
            'objectives_en' => "Objective 1\nObjective 2",
            'requirements_ar' => "شرط 1",
            'requirements_en' => "Requirement 1",
            'status' => 'active',
            'remove_image' => '0',
        ], $overrides);
    }

    private function makeProgram(array $overrides = []): Program
    {
        $program = new Program(array_merge([
            'title_ar' => 'برنامج',
            'title_en' => 'Existing Program',
            'summary_ar' => 'ملخص',
            'summary_en' => 'Excerpt',
            'description_ar' => '<p>a</p>',
            'description_en' => '<p>b</p>',
            'category' => 'health',
            'target_audience_ar' => 'الجميع',
            'target_audience_en' => 'Everyone',
            'location_ar' => 'عمان',
            'location_en' => 'Amman',
            'starts_on' => now()->addDays(5)->toDateString(),
            'ends_on' => now()->addDays(30)->toDateString(),
            'capacity' => 2,
            'objectives_ar' => 'هدف',
            'objectives_en' => 'Objective',
            'requirements_ar' => 'شرط',
            'requirements_en' => 'Requirement',
            'status' => 'active',
        ], $overrides));
        $program->slug = 'existing-program-'.uniqid();
        $program->created_by = $this->admin->id;
        $program->save();

        return $program;
    }

    private function makeParticipant(Program $program, array $overrides = []): ProgramParticipant
    {
        return $program->participants()->create(array_merge([
            'full_name' => 'Participant '.uniqid(),
            'email' => uniqid().'@example.com',
            'phone' => '+962790000000',
            'status' => 'pending',
            'registered_at' => now(),
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/programs')->assertStatus(401);

        $program = $this->makeProgram();

        $this->getJson('/api/v1/programs', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/programs/{$program->id}/participants", $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/programs', $this->payload(), $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/programs', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/programs', $this->headers($this->admin))->assertOk();
    }

    public function test_create_returns_admin_shape(): void
    {
        $response = $this->postJson('/api/v1/programs', $this->payload(), $this->headers($this->admin));

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title_en', 'Test Program')
            ->assertJsonPath('data.excerpt_en', 'English excerpt')
            ->assertJsonPath('data.category', 'education')
            ->assertJsonPath('data.target_audience_en', 'Youth')
            ->assertJsonPath('data.start_date', now()->addDays(10)->toDateString())
            ->assertJsonPath('data.end_date', now()->addDays(40)->toDateString())
            ->assertJsonPath('data.max_participants', 50)
            ->assertJsonPath('data.objectives_en', "Objective 1\nObjective 2")
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.participants_count', 0)
            ->assertJsonPath('data.image_url', null);

        $this->assertDatabaseHas('programs', [
            'title_en' => 'Test Program',
            'summary_en' => 'English excerpt',
            'capacity' => 50,
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_validation_errors(): void
    {
        $this->postJson('/api/v1/programs', [], $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title_ar', 'title_en', 'excerpt_ar', 'description_en', 'category', 'start_date', 'end_date', 'max_participants', 'objectives_ar', 'requirements_en', 'status']);

        $this->postJson('/api/v1/programs', $this->payload([
            'end_date' => now()->addDays(5)->toDateString(),
            'start_date' => now()->addDays(9)->toDateString(),
            'max_participants' => 0,
            'category' => 'bogus',
        ]), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['end_date', 'max_participants', 'category']);
    }

    public function test_image_upload_and_validation(): void
    {
        Storage::fake('public');

        $response = $this->post('/api/v1/programs', $this->payload([
            'image' => UploadedFile::fake()->image('cover.png', 600, 400),
        ]), $this->headers($this->admin));

        $response->assertStatus(201);
        $path = Program::first()->cover_image_path;
        $this->assertStringStartsWith('program-covers/', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertSame('/api/v1/files/'.$path, $response->json('data.image_url'));

        $this->app['auth']->forgetGuards();
        $this->post('/api/v1/programs', $this->payload([
            'image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]), $this->headers($this->admin))->assertStatus(422);
    }

    public function test_update_replaces_and_removes_image(): void
    {
        Storage::fake('public');
        $program = $this->makeProgram();
        $program->cover_image_path = UploadedFile::fake()->image('old.png')->store('program-covers', 'public');
        $program->save();
        $oldPath = $program->cover_image_path;

        $this->post("/api/v1/programs/{$program->id}", array_merge(
            $this->payload(['title_en' => 'Updated Program']),
            ['_method' => 'PUT', 'image' => UploadedFile::fake()->image('new.png')],
        ), $this->headers($this->admin))->assertOk();

        $program->refresh();
        $this->assertNotSame($oldPath, $program->cover_image_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($program->cover_image_path);
        $this->assertSame('Updated Program', $program->title_en);

        $this->app['auth']->forgetGuards();
        $this->post("/api/v1/programs/{$program->id}", array_merge(
            $this->payload(),
            ['_method' => 'PUT', 'remove_image' => '1'],
        ), $this->headers($this->admin))->assertOk();

        $program->refresh();
        $this->assertNull($program->cover_image_path);
    }

    public function test_list_search_filters_pagination(): void
    {
        $this->makeProgram(['title_en' => 'Coding Bootcamp', 'category' => 'education', 'status' => 'active', 'starts_on' => now()->addDays(3)->toDateString()]);
        $this->makeProgram(['title_en' => 'Health Awareness', 'category' => 'health', 'status' => 'draft', 'starts_on' => now()->addDays(20)->toDateString()]);
        $this->makeProgram(['title_en' => 'Community Cleanup', 'category' => 'environment', 'status' => 'archived', 'starts_on' => now()->addDays(40)->toDateString()]);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/programs?search=bootcamp', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title_en', 'Coding Bootcamp');

        $this->getJson('/api/v1/programs?category=health', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'health');

        $this->getJson('/api/v1/programs?status=archived', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $from = now()->addDays(15)->toDateString();
        $to = now()->addDays(30)->toDateString();
        $this->getJson("/api/v1/programs?date_from={$from}&date_to={$to}", $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title_en', 'Health Awareness');

        $this->getJson('/api/v1/programs?per_page=2&page=2', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_activate_deactivate_archive_delete(): void
    {
        Storage::fake('public');
        $program = $this->makeProgram(['status' => 'draft']);
        $headers = $this->headers($this->admin);

        $this->patchJson("/api/v1/programs/{$program->id}/activate", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'active');

        $this->patchJson("/api/v1/programs/{$program->id}/deactivate", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'draft');

        $this->patchJson("/api/v1/programs/{$program->id}/archive", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'archived');

        $program->cover_image_path = UploadedFile::fake()->image('c.png')->store('program-covers', 'public');
        $program->save();
        $path = $program->cover_image_path;

        $this->deleteJson("/api/v1/programs/{$program->id}", [], $headers)->assertOk();
        Storage::disk('public')->assertMissing($path);
        $this->assertSoftDeleted('programs', ['id' => $program->id]);
    }

    public function test_participants_list_and_status_actions(): void
    {
        $program = $this->makeProgram(['capacity' => 10]);
        $a = $this->makeParticipant($program, ['full_name' => 'Alpha Person', 'status' => 'pending']);
        $b = $this->makeParticipant($program, ['full_name' => 'Beta Person', 'status' => 'approved']);

        $headers = $this->headers($this->admin);

        $this->getJson("/api/v1/programs/{$program->id}/participants", $headers)
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);

        $this->getJson("/api/v1/programs/{$program->id}/participants?search=alpha", $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.participant_name', 'Alpha Person');

        $this->getJson("/api/v1/programs/{$program->id}/participants?status=approved", $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->patchJson("/api/v1/participants/{$a->id}/approve", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->patchJson("/api/v1/participants/{$b->id}/reject", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'rejected');
    }

    public function test_self_participation_guards(): void
    {
        $headers = $this->headers($this->member);

        // Archived program.
        $archived = $this->makeProgram(['status' => 'archived']);
        $this->postJson("/api/v1/programs/{$archived->id}/participate", [], $headers)->assertStatus(422);

        // Inactive (draft) program.
        $draft = $this->makeProgram(['status' => 'draft']);
        $this->postJson("/api/v1/programs/{$draft->id}/participate", [], $headers)->assertStatus(422);

        // Full program (capacity 2, rejected rows do not count).
        $full = $this->makeProgram(['capacity' => 2]);
        $this->makeParticipant($full, ['status' => 'pending']);
        $this->makeParticipant($full, ['status' => 'approved']);
        $this->makeParticipant($full, ['status' => 'rejected']);
        $this->postJson("/api/v1/programs/{$full->id}/participate", [], $headers)->assertStatus(422);

        // Success on an open program.
        $open = $this->makeProgram(['capacity' => 5]);
        $this->postJson("/api/v1/programs/{$open->id}/participate", [], $headers)
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        // Duplicate participation prevented.
        $this->postJson("/api/v1/programs/{$open->id}/participate", [], $headers)->assertStatus(422);

        // A rejected participant can re-apply (row reactivated, not duplicated).
        $again = $this->makeProgram(['capacity' => 5]);
        $rejected = $this->makeParticipant($again, ['email' => $this->member->email, 'status' => 'rejected']);
        $this->postJson("/api/v1/programs/{$again->id}/participate", [], $headers)
            ->assertStatus(201);
        $this->assertSame(1, $again->participants()->count());
        $this->assertSame('pending', $rejected->fresh()->status);
    }

    public function test_participants_count_excludes_rejected(): void
    {
        $program = $this->makeProgram(['capacity' => 10]);
        $this->makeParticipant($program, ['status' => 'pending']);
        $this->makeParticipant($program, ['status' => 'approved']);
        $this->makeParticipant($program, ['status' => 'completed']);
        $this->makeParticipant($program, ['status' => 'rejected']);

        $this->getJson("/api/v1/programs/{$program->id}", $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.participants_count', 3);
    }
}
