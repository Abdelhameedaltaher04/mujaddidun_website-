<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PartnerManagementApiTest extends TestCase
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
            'name_ar' => 'شريك تجريبي',
            'name_en' => 'Test Partner',
            'type' => 'strategic',
            'website_url' => 'https://example.org',
            'description_ar' => 'وصف عربي',
            'description_en' => 'English description',
            'display_order' => 1,
            'status' => 'active',
            'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ], $overrides);
    }

    private function makePartner(array $overrides = []): Partner
    {
        $partner = new Partner(array_merge([
            'name_ar' => 'شريك',
            'name_en' => 'Existing Partner',
            'type' => 'sponsor',
            'status' => 'active',
            'sort_order' => (int) Partner::max('sort_order') + 1,
        ], $overrides));
        $partner->slug = 'existing-partner-'.uniqid();
        $partner->save();

        return $partner;
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/partners')->assertStatus(401);

        $this->getJson('/api/v1/partners', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->post('/api/v1/partners', $this->payload(), $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/partners', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/partners', $this->headers($this->admin))->assertOk();
    }

    public function test_create_with_logo_and_shape(): void
    {
        Storage::fake('public');

        $response = $this->post('/api/v1/partners', $this->payload(), $this->headers($this->admin));

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name_en', 'Test Partner')
            ->assertJsonPath('data.type', 'strategic')
            ->assertJsonPath('data.website_url', 'https://example.org')
            ->assertJsonPath('data.display_order', 1)
            ->assertJsonPath('data.status', 'active');

        $partner = Partner::first();
        $this->assertStringStartsWith('partner-logos/', $partner->logo_path);
        Storage::disk('public')->assertExists($partner->logo_path);
        $this->assertSame('/api/v1/files/'.$partner->logo_path, $response->json('data.logo_url'));
    }

    public function test_validation_rules(): void
    {
        // Missing required fields (logo required on create).
        $this->postJson('/api/v1/partners', [], $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name_ar', 'name_en', 'type', 'display_order', 'status', 'logo']);

        // Invalid website URL.
        $this->post('/api/v1/partners', $this->payload(['website_url' => 'not-a-url']), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['website_url']);

        // Invalid type and non-positive display order.
        $this->post('/api/v1/partners', $this->payload(['type' => 'bogus', 'display_order' => 0]), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'display_order']);

        // Invalid logo format.
        $this->post('/api/v1/partners', $this->payload([
            'logo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]), $this->headers($this->admin))->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);

        // Logo over 5MB.
        $this->post('/api/v1/partners', $this->payload([
            'logo' => UploadedFile::fake()->create('big.png', 6000, 'image/png'),
        ]), $this->headers($this->admin))->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    }

    public function test_svg_logo_accepted(): void
    {
        Storage::fake('public');

        $svg = UploadedFile::fake()->createWithContent(
            'logo.svg',
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
        );

        $this->post('/api/v1/partners', $this->payload(['logo' => $svg]), $this->headers($this->admin))
            ->assertStatus(201);

        $this->assertStringEndsWith('.svg', Partner::first()->logo_path);
    }

    public function test_update_replaces_logo_and_keeps_when_absent(): void
    {
        Storage::fake('public');
        $partner = $this->makePartner();
        $partner->logo_path = UploadedFile::fake()->image('old.png')->store('partner-logos', 'public');
        $partner->save();
        $oldPath = $partner->logo_path;

        // Update without logo keeps the old file.
        $this->post("/api/v1/partners/{$partner->id}", array_merge(
            $this->payload(['name_en' => 'Updated Partner', 'logo' => null]),
            ['_method' => 'PUT'],
        ), $this->headers($this->admin))->assertOk()
            ->assertJsonPath('data.name_en', 'Updated Partner');

        $this->assertSame($oldPath, $partner->fresh()->logo_path);
        Storage::disk('public')->assertExists($oldPath);

        // Update with a new logo replaces and frees the old file.
        $this->app['auth']->forgetGuards();
        $this->post("/api/v1/partners/{$partner->id}", array_merge(
            $this->payload(['logo' => UploadedFile::fake()->image('new.webp')]),
            ['_method' => 'PUT'],
        ), $this->headers($this->admin))->assertOk();

        $partner->refresh();
        $this->assertNotSame($oldPath, $partner->logo_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($partner->logo_path);
    }

    public function test_list_search_filters_pagination(): void
    {
        $this->makePartner(['name_en' => 'Alpha Org', 'type' => 'strategic', 'status' => 'active']);
        $this->makePartner(['name_en' => 'Beta Media', 'type' => 'media', 'status' => 'inactive']);
        $this->makePartner(['name_ar' => 'جمعية النور', 'name_en' => 'Gamma Community', 'type' => 'community', 'status' => 'active']);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/partners?search=alpha', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name_en', 'Alpha Org');

        $this->getJson('/api/v1/partners?search='.urlencode('النور'), $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name_en', 'Gamma Community');

        $this->getJson('/api/v1/partners?type=media', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/partners?status=inactive', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/partners?per_page=2&page=2', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_status_toggle(): void
    {
        $partner = $this->makePartner(['status' => 'active']);
        $headers = $this->headers($this->admin);

        $this->patchJson("/api/v1/partners/{$partner->id}/status", ['status' => 'inactive'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'inactive');

        $this->patchJson("/api/v1/partners/{$partner->id}/status", ['status' => 'active'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'active');

        $this->patchJson("/api/v1/partners/{$partner->id}/status", ['status' => 'bogus'], $headers)
            ->assertStatus(422);
    }

    public function test_reorder_persists_and_validates_membership(): void
    {
        $a = $this->makePartner(['sort_order' => 1]);
        $b = $this->makePartner(['sort_order' => 2]);
        $c = $this->makePartner(['sort_order' => 3]);
        $headers = $this->headers($this->admin);

        $response = $this->patchJson('/api/v1/partners/reorder', [
            'ids' => [$c->id, $a->id, $b->id],
        ], $headers);

        $response->assertOk();
        $this->assertSame(
            [$c->id, $a->id, $b->id],
            array_column($response->json('data'), 'id'),
        );
        $this->assertSame(1, $c->fresh()->sort_order);
        $this->assertSame(2, $a->fresh()->sort_order);
        $this->assertSame(3, $b->fresh()->sort_order);

        // Incomplete or foreign sets are rejected.
        $this->patchJson('/api/v1/partners/reorder', ['ids' => [$a->id]], $headers)
            ->assertStatus(422);
        $this->patchJson('/api/v1/partners/reorder', ['ids' => [$a->id, $b->id, 999999]], $headers)
            ->assertStatus(422);

        // New order survives a fresh list request.
        $ordered = $this->getJson('/api/v1/partners', $headers)->assertOk()->json('data');
        $this->assertSame([$c->id, $a->id, $b->id], array_column($ordered, 'id'));
    }

    public function test_delete_soft_deletes_and_frees_logo(): void
    {
        Storage::fake('public');
        $partner = $this->makePartner();
        $partner->logo_path = UploadedFile::fake()->image('logo.png')->store('partner-logos', 'public');
        $partner->save();
        $path = $partner->logo_path;

        $this->deleteJson("/api/v1/partners/{$partner->id}", [], $this->headers($this->admin))->assertOk();

        Storage::disk('public')->assertMissing($path);
        $this->assertSoftDeleted('partners', ['id' => $partner->id]);
    }
}
