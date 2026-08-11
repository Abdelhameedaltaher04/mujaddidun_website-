<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\Role;
use App\Models\User;
use App\Models\Volunteer;
use App\Models\VolunteerApplication;
use App\Models\VolunteerApplicationDocument;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VolunteerApplicationApiTest extends TestCase
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

    private function makeApplication(array $volunteerOverrides = [], array $overrides = []): VolunteerApplication
    {
        static $seq = 0;
        $seq++;

        $volunteer = Volunteer::create(array_merge([
            'first_name' => 'Volunteer',
            'last_name' => "Number{$seq}",
            'email' => "volunteer{$seq}@example.com",
            'phone' => '+96279000010'.$seq,
            'country_code' => 'JO',
            'skills' => 'التنظيم, الترجمة',
            'availability' => 'weekends',
            'status' => 'pending',
        ], $volunteerOverrides));

        return VolunteerApplication::create(array_merge([
            'volunteer_id' => $volunteer->id,
            'status' => 'submitted',
            'motivation' => 'أرغب في خدمة المجتمع',
            'preferred_area' => 'التدريب التقني',
            'experience' => 'خبرة سنتين',
            'education' => 'بكالوريوس',
            'submitted_at' => now(),
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $application = $this->makeApplication();

        $this->getJson('/api/v1/volunteer-applications')->assertStatus(401);

        // Members have no access at all.
        foreach ([
            ['getJson', '/api/v1/volunteer-applications', []],
            ['getJson', "/api/v1/volunteer-applications/{$application->id}", []],
            ['getJson', "/api/v1/volunteer-applications/{$application->id}/notes", []],
            ['getJson', "/api/v1/volunteer-applications/{$application->id}/documents", []],
        ] as [$method, $uri, $body]) {
            $this->{$method}($uri, $this->headers($this->member))->assertStatus(403);
            $this->app['auth']->forgetGuards();
        }
        $this->patchJson("/api/v1/volunteer-applications/{$application->id}/status", ['status' => 'approved'], $this->headers($this->member))
            ->assertStatus(403);
        $this->app['auth']->forgetGuards();

        // Moderators are authorized reviewers (view + manage).
        $this->getJson('/api/v1/volunteer-applications', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->patchJson("/api/v1/volunteer-applications/{$application->id}/status", ['status' => 'under_review'], $this->headers($this->moderator))
            ->assertOk();
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/volunteer-applications/statistics', $this->headers($this->admin))->assertOk();
    }

    public function test_resource_shape(): void
    {
        $application = $this->makeApplication();

        $this->getJson("/api/v1/volunteer-applications/{$application->id}", $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.full_name', $application->volunteer->first_name.' '.$application->volunteer->last_name)
            ->assertJsonPath('data.email', $application->volunteer->email)
            ->assertJsonPath('data.country', 'JO')
            ->assertJsonPath('data.skills', ['التنظيم', 'الترجمة'])
            ->assertJsonPath('data.preferred_area', 'التدريب التقني')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.rejection_reason', null);
    }

    public function test_list_search_filters_pagination(): void
    {
        $program = Program::create([
            'title_ar' => 'برنامج التمكين',
            'title_en' => 'Empowerment Program',
            'slug' => 'empowerment',
            'description_ar' => 'وصف',
            'description_en' => 'Description',
            'status' => 'active',
        ]);

        $this->makeApplication(['first_name' => 'أحمد', 'last_name' => 'الخطيب', 'email' => 'ahmad@example.org']);
        $this->makeApplication(['phone' => '+962795554444'], ['program_id' => $program->id, 'status' => 'under_review']);
        $this->makeApplication([], ['status' => 'approved']);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/volunteer-applications?search=أحمد', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.full_name', 'أحمد الخطيب');

        $this->getJson('/api/v1/volunteer-applications?search=ahmad@example.org', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/volunteer-applications?search=795554444', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/volunteer-applications?status=pending', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');

        $this->getJson("/api/v1/volunteer-applications?program_id={$program->id}", $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $today = now()->toDateString();
        $this->getJson("/api/v1/volunteer-applications?date_from={$today}&date_to={$today}", $headers)
            ->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/volunteer-applications?date_to=2000-01-01', $headers)
            ->assertOk()->assertJsonCount(0, 'data');
        // Malformed dates (mid-typing) are ignored, not rejected.
        $this->getJson('/api/v1/volunteer-applications?date_from=13-2026-01', $headers)
            ->assertOk()->assertJsonCount(3, 'data');

        $this->getJson('/api/v1/volunteer-applications?per_page=2&page=2', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);

        $this->getJson('/api/v1/volunteer-applications?status=bogus', $headers)->assertStatus(422);
    }

    public function test_statistics(): void
    {
        $this->makeApplication();
        $this->makeApplication([], ['status' => 'under_review']);
        $this->makeApplication([], ['status' => 'approved']);
        $this->makeApplication([], ['status' => 'rejected', 'rejection_reason' => 'غير مكتمل']);
        $this->makeApplication([], ['status' => 'withdrawn']);

        $this->getJson('/api/v1/volunteer-applications/statistics', $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.total', 5)
            ->assertJsonPath('data.pending', 1)
            ->assertJsonPath('data.under_review', 1)
            ->assertJsonPath('data.approved', 1)
            ->assertJsonPath('data.rejected', 1);
    }

    public function test_valid_transitions_and_rejection_reason(): void
    {
        $headers = $this->headers($this->admin);

        $application = $this->makeApplication();
        $this->patchJson("/api/v1/volunteer-applications/{$application->id}/status", ['status' => 'under_review'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'under_review');

        $this->patchJson("/api/v1/volunteer-applications/{$application->id}/status", ['status' => 'approved'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertSame($this->admin->id, $application->fresh()->reviewed_by);
        $this->assertNotNull($application->fresh()->reviewed_at);

        // Rejection requires a reason.
        $reject = $this->makeApplication();
        $this->patchJson("/api/v1/volunteer-applications/{$reject->id}/status", ['status' => 'rejected'], $headers)
            ->assertStatus(422)->assertJsonValidationErrors(['rejection_reason']);
        $this->patchJson("/api/v1/volunteer-applications/{$reject->id}/status", ['status' => 'rejected', 'rejection_reason' => 'لا تتوفر الخبرة المطلوبة'], $headers)
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'لا تتوفر الخبرة المطلوبة');

        $withdraw = $this->makeApplication();
        $this->patchJson("/api/v1/volunteer-applications/{$withdraw->id}/status", ['status' => 'withdrawn'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'withdrawn');
    }

    public function test_invalid_transitions_rejected(): void
    {
        $headers = $this->headers($this->admin);

        $approved = $this->makeApplication([], ['status' => 'approved']);
        $rejected = $this->makeApplication([], ['status' => 'rejected', 'rejection_reason' => 'سبب']);
        $withdrawn = $this->makeApplication([], ['status' => 'withdrawn']);

        foreach ([$approved, $rejected, $withdrawn] as $final) {
            $this->patchJson("/api/v1/volunteer-applications/{$final->id}/status", ['status' => 'under_review'], $headers)
                ->assertStatus(422);
        }

        // Approved cannot be rejected afterwards.
        $this->patchJson("/api/v1/volunteer-applications/{$approved->id}/status", ['status' => 'rejected', 'rejection_reason' => 'سبب'], $headers)
            ->assertStatus(422);

        // Invalid status value entirely.
        $pending = $this->makeApplication();
        $this->patchJson("/api/v1/volunteer-applications/{$pending->id}/status", ['status' => 'archived'], $headers)
            ->assertStatus(422);

        $this->assertSame('approved', $approved->fresh()->status);
        $this->assertSame('submitted', $pending->fresh()->status);
    }

    public function test_internal_notes(): void
    {
        $application = $this->makeApplication();
        $headers = $this->headers($this->admin);

        $this->postJson("/api/v1/volunteer-applications/{$application->id}/notes", ['body' => ''], $headers)
            ->assertStatus(422);

        $this->postJson("/api/v1/volunteer-applications/{$application->id}/notes", ['body' => 'ملاحظة داخلية'], $headers)
            ->assertStatus(201)
            ->assertJsonPath('data.body', 'ملاحظة داخلية')
            ->assertJsonPath('data.author_name', 'Admin Test');

        $this->getJson("/api/v1/volunteer-applications/{$application->id}/notes", $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        // Notes are protected from regular members.
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/volunteer-applications/{$application->id}/notes", $this->headers($this->member))
            ->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/volunteer-applications/{$application->id}/notes")
            ->assertStatus(401);
    }

    public function test_private_documents(): void
    {
        Storage::fake('local');

        $application = $this->makeApplication();
        Storage::disk('local')->put('volunteer-documents/cv.pdf', '%PDF-1.4 test');

        $document = VolunteerApplicationDocument::create([
            'volunteer_application_id' => $application->id,
            'name' => 'CV.pdf',
            'file_path' => 'volunteer-documents/cv.pdf',
            'mime_type' => 'application/pdf',
            'uploaded_at' => now(),
        ]);

        // Members cannot list documents.
        $this->getJson("/api/v1/volunteer-applications/{$application->id}/documents", $this->headers($this->member))
            ->assertStatus(403);
        $this->app['auth']->forgetGuards();

        // Reviewers get signed relative URLs, never raw storage paths.
        $response = $this->getJson("/api/v1/volunteer-applications/{$application->id}/documents", $this->headers($this->admin))
            ->assertOk()->assertJsonCount(1, 'data');
        $url = $response->json('data.0.url');
        $this->assertStringContainsString('signature=', $url);
        $this->assertStringNotContainsString('volunteer-documents/cv.pdf', $url);

        // The signed URL works without auth (browser <img>/<iframe> can't
        // send bearer headers) but ONLY with a valid signature.
        $this->app['auth']->forgetGuards();
        $this->get($url)->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->get("/api/v1/volunteer-documents/{$document->id}")->assertStatus(403);
        $this->get($url.'tampered')->assertStatus(403);
    }
}
