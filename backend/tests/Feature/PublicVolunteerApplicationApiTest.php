<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Volunteer;
use App\Models\VolunteerApplication;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicVolunteerApplicationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
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

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'أحمد محمد العلي',
            'date_of_birth' => '1995-04-10',
            'email' => 'volunteer-test@example.com',
            'phone' => '+962791234567',
            'interests' => ['feeding', 'media'],
            'availability' => ['morning', 'weekends'],
            'experience' => 'خبرة سابقة في العمل التطوعي.',
        ], $overrides);
    }

    public function test_public_application_creates_volunteer_and_submitted_application(): void
    {
        $response = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload())
            ->assertCreated();

        $data = $response->json('data');
        $this->assertSame('pending', $data['status']);
        $this->assertSame(['id', 'status'], array_keys($data));

        $volunteer = Volunteer::where('email', 'volunteer-test@example.com')->firstOrFail();
        $this->assertSame('أحمد', $volunteer->first_name);
        $this->assertSame('محمد العلي', $volunteer->last_name);
        $this->assertSame('الإطعام, الإعلام والتصوير', $volunteer->skills);
        $this->assertSame('صباحاً, عطلة نهاية الأسبوع', $volunteer->availability);
        $this->assertSame('pending', $volunteer->status);

        $application = VolunteerApplication::findOrFail($data['id']);
        $this->assertSame($volunteer->id, $application->volunteer_id);
        $this->assertSame('submitted', $application->status);
        $this->assertSame('خبرة سابقة في العمل التطوعي.', $application->experience);
        $this->assertNotNull($application->submitted_at);
        $this->assertNull($application->program_id);
        $this->assertNull($application->reviewed_by);
    }

    public function test_client_cannot_set_status_or_review_fields(): void
    {
        $response = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload([
            'status' => 'approved',
            'review_notes' => 'injected',
            'reviewed_by' => 1,
            'rejection_reason' => 'x',
        ]))->assertCreated();

        $application = VolunteerApplication::findOrFail($response->json('data.id'));
        $this->assertSame('submitted', $application->status);
        $this->assertNull($application->review_notes);
        $this->assertNull($application->reviewed_by);
        $this->assertNull($application->rejection_reason);
    }

    public function test_validation_rejects_bad_input(): void
    {
        $cases = [
            [['full_name' => ''], 'full_name'],
            [['email' => 'not-an-email'], 'email'],
            [['phone' => ''], 'phone'],
            [['date_of_birth' => '2999-01-01'], 'date_of_birth'],
            [['date_of_birth' => 'not-a-date'], 'date_of_birth'],
            [['interests' => []], 'interests'],
            [['interests' => ['hacking']], 'interests.0'],
            [['availability' => []], 'availability'],
            [['availability' => ['midnight']], 'availability.0'],
            [['website' => 'spam.com'], 'website'],
        ];
        foreach ($cases as [$overrides, $field]) {
            $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload($overrides))
                ->assertStatus(422)->assertJsonValidationErrors([$field]);
        }
        $this->assertDatabaseCount('volunteer_applications', 0);
        $this->assertDatabaseCount('volunteers', 0);
    }

    public function test_duplicate_open_application_is_idempotent_and_reapplication_after_final_status_allowed(): void
    {
        $first = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload())
            ->assertCreated()->json('data.id');

        // Second submission while first is still open -> same generic success
        // (no enumeration oracle), no new records, echoes the open application.
        $dupe = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload())
            ->assertCreated()->json('data');
        $this->assertSame($first, $dupe['id']);
        $this->assertSame('pending', $dupe['status']);
        $this->assertDatabaseCount('volunteer_applications', 1);
        $this->assertDatabaseCount('volunteers', 1);

        // Finalize the first application, then re-apply: reuses the volunteer
        // and files a new application WITHOUT overwriting the stored profile
        // (unauthenticated requests must not rewrite existing PII).
        VolunteerApplication::findOrFail($first)->update(['status' => 'rejected']);
        $second = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload([
            'full_name' => 'اسم مزيف مهاجم',
            'phone' => '+962790000000',
            'interests' => ['events'],
        ]))->assertCreated()->json('data.id');

        $this->assertNotSame($first, $second);
        $this->assertDatabaseCount('volunteers', 1);
        $this->assertDatabaseCount('volunteer_applications', 2);
        $volunteer = Volunteer::where('email', 'volunteer-test@example.com')->firstOrFail();
        $this->assertSame('أحمد', $volunteer->first_name);
        $this->assertSame('+962791234567', $volunteer->phone);
        $this->assertSame('الإطعام, الإعلام والتصوير', $volunteer->skills);

        // The reapplication's own details are preserved on the application
        // snapshot and exposed to admins, even though the profile is frozen.
        $snapshot = VolunteerApplication::findOrFail($second)->applicant_snapshot;
        $this->assertSame('اسم مزيف مهاجم', $snapshot['full_name']);
        $this->assertSame('+962790000000', $snapshot['phone']);
        $this->assertSame('تنظيم الفعاليات', $snapshot['skills']);

        $this->app['auth']->forgetGuards();
        $admin = $this->makeUser('admin', 'snapshot-admin@example.com');
        $token = $admin->createToken('t')->plainTextToken;
        $details = $this->getJson("/api/v1/volunteer-applications/{$second}", [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk()->json('data');
        $this->assertSame('اسم مزيف مهاجم', $details['submitted_details']['full_name']);
        $this->assertSame('+962790000000', $details['submitted_details']['phone']);
    }

    public function test_volunteer_email_unique_index_blocks_duplicate_profiles(): void
    {
        Volunteer::create([
            'first_name' => 'أ', 'last_name' => 'ب',
            'email' => 'unique-check@example.com', 'phone' => '+962790000001',
            'status' => 'pending',
        ]);
        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        Volunteer::create([
            'first_name' => 'ج', 'last_name' => 'د',
            'email' => 'unique-check@example.com', 'phone' => '+962790000002',
            'status' => 'pending',
        ]);
    }

    public function test_application_appears_in_admin_list_and_admin_routes_stay_protected(): void
    {
        $id = $this->postJson('/api/v1/public/volunteer-applications', $this->validPayload())
            ->assertCreated()->json('data.id');

        // Unauthenticated admin API access is rejected.
        $this->getJson('/api/v1/volunteer-applications')->assertUnauthorized();

        // Regular member cannot read or mutate.
        $member = $this->makeUser('user', 'member-pv@example.com');
        $memberToken = $member->createToken('t')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/volunteer-applications', ['Authorization' => 'Bearer '.$memberToken])
            ->assertForbidden();
        $this->patchJson("/api/v1/volunteer-applications/{$id}/status", ['status' => 'approved'], ['Authorization' => 'Bearer '.$memberToken])
            ->assertForbidden();

        // Admin sees it, can search it, and can transition it.
        $this->app['auth']->forgetGuards();
        $admin = $this->makeUser('admin', 'admin-pv@example.com');
        $token = $admin->createToken('t')->plainTextToken;

        $list = $this->getJson('/api/v1/volunteer-applications?search=volunteer-test@example.com', [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk()->json('data');
        $row = collect($list)->firstWhere('id', $id);
        $this->assertNotNull($row);
        $this->assertSame('pending', $row['status']);
        $this->assertSame('أحمد محمد العلي', $row['full_name']);
        $this->assertSame(['الإطعام', 'الإعلام والتصوير'], $row['skills']);

        $this->patchJson("/api/v1/volunteer-applications/{$id}/status", ['status' => 'under_review'], [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();
        $this->assertSame('under_review', VolunteerApplication::findOrFail($id)->status);
    }
}
