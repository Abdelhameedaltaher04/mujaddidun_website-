<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicPartnersApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function makePartner(array $overrides = []): Partner
    {
        return Partner::create(array_merge([
            'name_ar' => 'شريك', 'name_en' => 'Partner', 'slug' => 'p-'.uniqid(),
            'type' => 'strategic', 'status' => 'active',
            'description_ar' => 'وصف', 'description_en' => 'description',
            'website_url' => 'https://example.org',
            'sort_order' => 0,
        ], $overrides));
    }

    public function test_list_exposes_only_active_partners_with_public_fields(): void
    {
        $second = $this->makePartner(['sort_order' => 2]);
        $first = $this->makePartner(['sort_order' => 1, 'logo_path' => 'partner-logos/x.png']);
        $this->makePartner(['status' => 'inactive']);

        $data = $this->getJson('/api/v1/public/partners')->assertOk()->json('data');
        $this->assertSame([$first->id, $second->id], array_column($data, 'id'));

        $row = $data[0];
        $this->assertSame('شريك', $row['name_ar']);
        $this->assertSame('https://example.org', $row['website_url']);
        $this->assertSame('/api/v1/files/partner-logos/x.png', $row['logo_url']);
        foreach (['status', 'sort_order', 'display_order', 'type', 'created_at'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $row);
        }
    }

    public function test_inactive_partner_logo_files_hidden_from_public(): void
    {
        Storage::fake('public');
        $disk = Storage::disk('public');
        $disk->put('partner-logos/active.png', 'x');
        $disk->put('partner-logos/inactive.png', 'x');

        $this->makePartner(['logo_path' => 'partner-logos/active.png']);
        $this->makePartner(['status' => 'inactive', 'logo_path' => 'partner-logos/inactive.png']);

        // Active logos are public but short-lived in caches, so deactivation
        // takes effect within minutes.
        $this->get('/api/v1/files/partner-logos/active.png')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=300, public');
        $this->get('/api/v1/files/partner-logos/inactive.png')->assertNotFound();

        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'admin')->first()->id,
        ]);
        $this->get('/api/v1/files/partner-logos/inactive.png', [
            'Authorization' => 'Bearer '.$admin->createToken('t')->plainTextToken,
        ])->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    }
}
