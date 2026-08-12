<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\SiteCtaSection;
use App\Models\SiteStatistic;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WebsiteContentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $moderator;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create(['role_id' => Role::where('slug', 'admin')->value('id')]);
        $this->moderator = User::factory()->create(['role_id' => Role::where('slug', 'moderator')->value('id')]);
        $this->member = User::factory()->create(['role_id' => Role::where('slug', 'user')->value('id')]);
    }

    private function tokenFor(User $user): array
    {
        $this->app['auth']->forgetGuards();

        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_authorization(): void
    {
        $this->getJson('/api/v1/content')->assertUnauthorized();
        $this->putJson('/api/v1/content/hero', [])->assertUnauthorized();
        $this->postJson('/api/v1/content/statistics', [])->assertUnauthorized();

        foreach ([$this->moderator, $this->member] as $user) {
            $headers = $this->tokenFor($user);
            $this->getJson('/api/v1/content', $headers)->assertForbidden();
            $this->putJson('/api/v1/content/hero', [], $headers)->assertForbidden();
            $this->postJson('/api/v1/content/statistics', [], $headers)->assertForbidden();
            $this->putJson('/api/v1/content/homepage-sections', [], $headers)->assertForbidden();
        }

        // Unknown singleton section → 404 (route constraint).
        $this->putJson('/api/v1/content/nav', [], $this->tokenFor($this->admin))->assertNotFound();
    }

    public function test_admin_payload_has_defaults_matching_previous_hardcoded_homepage(): void
    {
        $response = $this->getJson('/api/v1/content', $this->tokenFor($this->admin))->assertOk();

        $response->assertJsonStructure(['data' => [
            'sections' => [
                'hero' => ['title_ar', 'title_en', 'description_ar', 'description_en', 'primary_button_text_ar', 'primary_button_url', 'secondary_button_text_ar', 'secondary_button_url', 'background_image_url', 'is_active'],
                'about' => ['title_ar', 'title_en', 'description_ar', 'description_en', 'image_url', 'is_active'],
                'vision_mission' => ['vision_ar', 'vision_en', 'mission_ar', 'mission_en', 'is_active'],
                'footer' => ['description_ar', 'description_en', 'copyright_ar', 'copyright_en'],
            ],
            'statistics',
            'ctas',
            'homepage_sections',
        ]]);

        $this->assertSame('We Feed . We Shelter . We Empower', $response->json('data.sections.hero.title_en'));
        $this->assertCount(4, $response->json('data.statistics'));
        $this->assertCount(1, $response->json('data.ctas'));
        $this->assertCount(9, $response->json('data.homepage_sections'));
    }

    public function test_singleton_sections_update_and_persist(): void
    {
        Storage::fake('public');
        $admin = $this->tokenFor($this->admin);

        $this->putJson('/api/v1/content/vision_mission', [
            'vision_ar' => 'رؤية جديدة',
            'vision_en' => 'New vision',
            'mission_ar' => 'رسالة جديدة',
            'mission_en' => 'New mission',
            'is_active' => true,
        ], $admin)->assertOk();

        // Multipart PUT via method spoofing for the hero image.
        $this->post('/api/v1/content/hero', [
            '_method' => 'PUT',
            'title_ar' => 'عنوان',
            'title_en' => 'Title',
            'description_ar' => 'وصف',
            'description_en' => 'Description',
            'primary_button_text_ar' => 'تبرع',
            'primary_button_text_en' => 'Donate',
            'primary_button_url' => '/donate',
            'secondary_button_text_ar' => '',
            'secondary_button_text_en' => '',
            'secondary_button_url' => '',
            'is_active' => '1',
            'background_image' => UploadedFile::fake()->image('hero.jpg', 1200, 600),
        ], $admin)->assertOk();

        $fresh = $this->getJson('/api/v1/content', $admin)->assertOk();
        $this->assertSame('New vision', $fresh->json('data.sections.vision_mission.vision_en'));
        $this->assertSame('Title', $fresh->json('data.sections.hero.title_en'));
        $this->assertStringStartsWith('/api/v1/files/content-images/', $fresh->json('data.sections.hero.background_image_url'));

        // Invalid payloads are rejected.
        $this->putJson('/api/v1/content/vision_mission', ['vision_ar' => ''], $admin)->assertStatus(422);
    }

    public function test_statistics_crud_and_reorder(): void
    {
        $admin = $this->tokenFor($this->admin);

        $created = $this->postJson('/api/v1/content/statistics', [
            'number' => '99+',
            'label_ar' => 'اختبار',
            'label_en' => 'Test stat',
            'icon' => 'star',
            'is_active' => true,
        ], $admin)->assertCreated()->json('data');

        $this->putJson("/api/v1/content/statistics/{$created['id']}", [
            'number' => '100+',
            'label_ar' => 'اختبار',
            'label_en' => 'Updated stat',
            'icon' => null,
            'is_active' => false,
        ], $admin)->assertOk()->assertJsonPath('data.number', '100+');

        // Reorder must include every id exactly once.
        $ids = SiteStatistic::orderBy('display_order')->pluck('id')->all();
        $this->patchJson('/api/v1/content/statistics/reorder', ['ids' => [$ids[0]]], $admin)->assertStatus(422);
        $reversed = array_reverse($ids);
        $this->patchJson('/api/v1/content/statistics/reorder', ['ids' => $reversed], $admin)->assertOk();
        $this->assertSame($reversed, SiteStatistic::orderBy('display_order')->pluck('id')->all());

        $this->deleteJson("/api/v1/content/statistics/{$created['id']}", [], $admin)->assertOk();
        $this->assertDatabaseMissing('site_statistics', ['id' => $created['id']]);
    }

    public function test_cta_crud_with_image(): void
    {
        Storage::fake('public');
        $admin = $this->tokenFor($this->admin);

        $created = $this->post('/api/v1/content/ctas', [
            'title_ar' => 'دعوة',
            'title_en' => 'Call to action',
            'description_ar' => '',
            'description_en' => '',
            'button_text_ar' => 'اذهب',
            'button_text_en' => 'Go',
            'button_url' => '/programs',
            'is_active' => '1',
            'image' => UploadedFile::fake()->image('cta.png', 800, 400),
        ], $admin)->assertCreated()->json('data');

        $this->assertStringStartsWith('/api/v1/files/content-images/', $created['image_url']);

        $this->post("/api/v1/content/ctas/{$created['id']}", [
            '_method' => 'PUT',
            'title_ar' => 'دعوة معدلة',
            'title_en' => 'Updated CTA',
            'description_ar' => '',
            'description_en' => '',
            'button_text_ar' => '',
            'button_text_en' => '',
            'button_url' => '',
            'is_active' => '0',
            'remove_image' => '1',
        ], $admin)->assertOk()
            ->assertJsonPath('data.title_en', 'Updated CTA')
            ->assertJsonPath('data.image_url', null);

        $this->deleteJson("/api/v1/content/ctas/{$created['id']}", [], $admin)->assertOk();
    }

    public function test_homepage_sections_visibility_and_order(): void
    {
        $admin = $this->tokenFor($this->admin);

        $current = $this->getJson('/api/v1/content', $admin)->json('data.homepage_sections');
        $payload = array_map(fn ($row) => [
            'section_key' => $row['section_key'],
            'is_visible' => $row['section_key'] !== 'partners',
        ], array_reverse($current));

        $updated = $this->putJson('/api/v1/content/homepage-sections', ['sections' => $payload], $admin)
            ->assertOk()->json('data');

        $this->assertSame($payload[0]['section_key'], $updated[0]['section_key']);
        $partners = collect($updated)->firstWhere('section_key', 'partners');
        $this->assertFalse((bool) $partners['is_visible']);

        // Missing a section → 422.
        $this->putJson('/api/v1/content/homepage-sections', ['sections' => array_slice($payload, 1)], $admin)
            ->assertStatus(422);
    }

    public function test_public_content_is_sanitized_and_ordered(): void
    {
        // Deactivate one statistic and hide one section as admin.
        SiteStatistic::orderBy('id')->first()->update(['is_active' => false]);
        SiteCtaSection::query()->update(['is_active' => false]);

        $response = $this->getJson('/api/v1/public/content')->assertOk();

        $this->assertCount(3, $response->json('data.statistics'));
        $this->assertCount(0, $response->json('data.ctas'));
        $this->assertCount(9, $response->json('data.homepage_sections'));

        // Active statistics come back in display order without admin fields.
        $orders = array_column($response->json('data.homepage_sections'), 'display_order');
        $sorted = $orders;
        sort($sorted);
        $this->assertSame($sorted, $orders);
    }

    public function test_inactive_singleton_sections_do_not_leak_publicly(): void
    {
        Storage::fake('public');
        $headers = $this->tokenFor($this->admin);

        // Deactivate the hero (with a background image) as admin.
        $hero = array_merge(
            \App\Services\Content\WebsiteContentService::defaults()['hero'],
            ['title_ar' => 'سري', 'title_en' => 'Secret draft', 'is_active' => '0'],
        );
        unset($hero['background_image_path']);
        $this->post('/api/v1/content/hero', array_merge($hero, [
            '_method' => 'PUT',
            'background_image' => UploadedFile::fake()->image('bg.png'),
        ]), $headers)->assertOk();

        $this->app['auth']->forgetGuards();
        $section = $this->getJson('/api/v1/public/content')->assertOk()->json('data.sections.hero');
        $this->assertSame(['is_active' => false], $section);

        // Its image file must not be served publicly either.
        $path = \App\Models\WebsiteSetting::where('setting_key', 'content.hero')
            ->value('value_json')['background_image_path'];
        $this->get('/api/v1/files/'.$path)->assertNotFound();

        // Staff can still preview it; reactivating restores public access.
        $this->get('/api/v1/files/'.$path, $headers)->assertOk();
        $this->post('/api/v1/content/hero', array_merge($hero, ['_method' => 'PUT', 'is_active' => '1']), $headers)->assertOk();
        $this->app['auth']->forgetGuards();
        $this->get('/api/v1/files/'.$path)->assertOk();
        $this->assertSame('Secret draft', $this->getJson('/api/v1/public/content')->json('data.sections.hero.title_en'));
    }

    public function test_inactive_cta_image_is_not_served_publicly(): void
    {
        Storage::fake('public');
        $headers = $this->tokenFor($this->admin);

        $id = $this->post('/api/v1/content/ctas', [
            'title_ar' => 'ت', 'title_en' => 'T',
            'description_ar' => 'وصف', 'description_en' => 'Desc',
            'button_text_ar' => 'ز', 'button_text_en' => 'B',
            'button_url' => '/donate',
            'is_active' => '0',
            'image' => UploadedFile::fake()->image('cta.png'),
        ], $headers)->assertCreated()->json('data.id');

        $path = SiteCtaSection::findOrFail($id)->image_path;
        $this->app['auth']->forgetGuards();
        $this->get('/api/v1/files/'.$path)->assertNotFound();

        SiteCtaSection::whereKey($id)->update(['is_active' => true]);
        $this->get('/api/v1/files/'.$path)->assertOk();
    }
}
