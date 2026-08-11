<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\WebsiteSetting;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WebsiteSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $moderator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create(['role_id' => Role::where('slug', 'admin')->value('id')]);
        $this->moderator = User::factory()->create(['role_id' => Role::where('slug', 'moderator')->value('id')]);
    }

    private function tokenFor(User $user): array
    {
        $this->app['auth']->forgetGuards();

        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_authorization(): void
    {
        // Unauthenticated → 401.
        $this->getJson('/api/v1/settings')->assertUnauthorized();
        $this->putJson('/api/v1/settings/contact', [])->assertUnauthorized();

        // Moderator → 403 on read and write.
        $mod = $this->tokenFor($this->moderator);
        $this->getJson('/api/v1/settings', $mod)->assertForbidden();
        $this->putJson('/api/v1/settings/controls', [], $mod)->assertForbidden();
        $this->putJson('/api/v1/settings/general', [], $mod)->assertForbidden();

        // Unknown section → 404 (route constraint).
        $admin = $this->tokenFor($this->admin);
        $this->putJson('/api/v1/settings/smtp', [], $admin)->assertNotFound();
    }

    public function test_admin_gets_full_settings_with_defaults(): void
    {
        $response = $this->getJson('/api/v1/settings', $this->tokenFor($this->admin))->assertOk();

        $response->assertJsonStructure(['data' => [
            'general' => ['site_name_ar', 'site_name_en', 'description_ar', 'description_en', 'logo_url', 'favicon_url'],
            'contact' => ['phone', 'whatsapp', 'email', 'address_ar', 'address_en', 'maps_url'],
            'social' => ['facebook' => ['value', 'enabled'], 'instagram', 'linkedin', 'youtube', 'whatsapp'],
            'branding' => ['primary_logo_url', 'footer_logo_url', 'favicon_url', 'website_title', 'default_language'],
            'seo' => ['meta_title_ar', 'meta_title_en', 'meta_description_ar', 'meta_description_en', 'keywords', 'og_image_url'],
            'email' => ['sender_name', 'sender_email', 'reply_to_email'],
            'controls' => ['maintenance_mode', 'allow_registrations', 'allow_event_registrations', 'allow_volunteer_applications', 'show_donations', 'show_partners', 'show_faqs'],
        ]]);

        // No secret-looking keys anywhere in the payload.
        $flat = json_encode($response->json('data'));
        foreach (['password', 'smtp', 'secret', 'api_key', 'token'] as $needle) {
            $this->assertStringNotContainsStringIgnoringCase($needle, $flat);
        }
    }

    public function test_sections_update_and_persist(): void
    {
        $admin = $this->tokenFor($this->admin);

        $this->putJson('/api/v1/settings/contact', [
            'phone' => '+96265009900',
            'whatsapp' => '+962795551234',
            'email' => 'contact@mujaddidun.org',
            'address_ar' => 'عمّان',
            'address_en' => 'Amman',
            'maps_url' => 'https://maps.google.com/?q=Amman',
        ], $admin)->assertOk()->assertJsonPath('data.contact.phone', '+96265009900');

        $this->putJson('/api/v1/settings/social', [
            'facebook' => ['value' => 'https://facebook.com/mujaddidun', 'enabled' => true],
            'instagram' => ['value' => '', 'enabled' => false],
            'linkedin' => ['value' => '', 'enabled' => false],
            'youtube' => ['value' => '', 'enabled' => false],
            'whatsapp' => ['value' => '+962795551234', 'enabled' => true],
        ], $admin)->assertOk()->assertJsonPath('data.social.facebook.enabled', true);

        $this->putJson('/api/v1/settings/email', [
            'sender_name' => 'Mujaddidun',
            'sender_email' => 'no-reply@mujaddidun.org',
            'reply_to_email' => 'info@mujaddidun.org',
        ], $admin)->assertOk();

        $this->putJson('/api/v1/settings/controls', [
            'maintenance_mode' => true,
            'allow_registrations' => false,
            'allow_event_registrations' => true,
            'allow_volunteer_applications' => true,
            'show_donations' => true,
            'show_partners' => false,
            'show_faqs' => true,
        ], $admin)->assertOk()->assertJsonPath('data.controls.maintenance_mode', true);

        // Persisted in DB, not only in the response.
        $this->assertSame(4, WebsiteSetting::count());
        $fresh = $this->getJson('/api/v1/settings', $admin)->json('data');
        $this->assertSame('+96265009900', $fresh['contact']['phone']);
        $this->assertTrue($fresh['controls']['maintenance_mode']);
        $this->assertFalse($fresh['controls']['show_partners']);
    }

    public function test_invalid_values_rejected(): void
    {
        $admin = $this->tokenFor($this->admin);

        $this->putJson('/api/v1/settings/contact', [
            'phone' => 'not-a-phone', 'whatsapp' => null, 'email' => 'not-an-email',
            'address_ar' => null, 'address_en' => null, 'maps_url' => 'javascript:alert(1)',
        ], $admin)->assertStatus(422)->assertJsonValidationErrors(['phone', 'email', 'maps_url']);

        $this->putJson('/api/v1/settings/social', [
            'facebook' => ['value' => '', 'enabled' => true],
            'instagram' => ['value' => 'ftp://bad', 'enabled' => true],
            'linkedin' => ['value' => '', 'enabled' => false],
            'youtube' => ['value' => '', 'enabled' => false],
            'whatsapp' => ['value' => 'abc', 'enabled' => true],
        ], $admin)->assertStatus(422)
            ->assertJsonValidationErrors(['facebook.value', 'instagram.value', 'whatsapp.value']);

        $this->putJson('/api/v1/settings/controls', [
            'maintenance_mode' => 'sometimes',
        ], $admin)->assertStatus(422);

        $this->putJson('/api/v1/settings/branding', [
            'website_title' => 'x', 'default_language' => 'fr',
        ], $admin)->assertStatus(422)->assertJsonValidationErrors(['default_language']);
    }

    public function test_branding_upload_replace_and_remove(): void
    {
        Storage::fake('public');
        $admin = $this->tokenFor($this->admin);

        // Multipart sections use POST + _method=PUT (PHP cannot parse
        // multipart PUT bodies) — mirror the frontend exactly.
        $first = $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT',
            'website_title' => 'Mujaddidun | مجددون',
            'default_language' => 'ar',
            'primary_logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ], $admin)->assertOk();

        $url = $first->json('data.branding.primary_logo_url');
        $this->assertStringStartsWith('/api/v1/files/site-branding/', $url);
        $path = substr($url, strlen('/api/v1/files/'));
        Storage::disk('public')->assertExists($path);

        // Replace deletes the old file.
        $second = $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT',
            'website_title' => 'Mujaddidun | مجددون',
            'default_language' => 'ar',
            'primary_logo' => UploadedFile::fake()->image('logo2.webp', 100, 100),
        ], $admin)->assertOk();
        Storage::disk('public')->assertMissing($path);
        $this->assertNotSame($url, $second->json('data.branding.primary_logo_url'));

        // Oversized/unsupported uploads rejected.
        $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT', 'website_title' => 'x', 'default_language' => 'ar',
            'primary_logo' => UploadedFile::fake()->create('big.png', 6000, 'image/png'),
        ], $admin)->assertStatus(422);
        $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT', 'website_title' => 'x', 'default_language' => 'ar',
            'primary_logo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ], $admin)->assertStatus(422);

        // Removal clears the stored file, and a save without a new upload
        // keeps the current one.
        $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT',
            'website_title' => 'Mujaddidun | مجددون',
            'default_language' => 'en',
        ], $admin)->assertOk()->assertJsonPath('data.branding.primary_logo_url', $second->json('data.branding.primary_logo_url'));

        $this->post('/api/v1/settings/branding', [
            '_method' => 'PUT',
            'website_title' => 'Mujaddidun | مجددون',
            'default_language' => 'en',
            'remove_primary_logo' => '1',
        ], $admin)->assertOk()->assertJsonPath('data.branding.primary_logo_url', null);
    }

    public function test_public_endpoint_is_sanitized(): void
    {
        // Write email settings first so a leak would be visible.
        $this->putJson('/api/v1/settings/email', [
            'sender_name' => 'Mujaddidun',
            'sender_email' => 'no-reply@mujaddidun.org',
            'reply_to_email' => 'info@mujaddidun.org',
        ], $this->tokenFor($this->admin))->assertOk();

        $response = $this->getJson('/api/v1/settings/public')->assertOk();
        $data = $response->json('data');

        $this->assertArrayHasKey('general', $data);
        $this->assertArrayHasKey('contact', $data);
        $this->assertArrayHasKey('social', $data);
        $this->assertArrayHasKey('controls', $data);
        $this->assertArrayNotHasKey('email', $data);
        $this->assertStringNotContainsString('no-reply@', json_encode($data));
    }
}
