<?php

namespace Tests\Feature;

use App\Models\GalleryAlbum;
use App\Models\GalleryImage;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicGalleryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('t')->plainTextToken];
    }

    private function makeAlbum(array $overrides = []): GalleryAlbum
    {
        return GalleryAlbum::create(array_merge([
            'title_ar' => 'ألبوم', 'title_en' => 'Album', 'slug' => 'a-'.uniqid(),
            'description_ar' => 'وصف', 'description_en' => 'description',
            'status' => 'published', 'published_at' => now(),
        ], $overrides));
    }

    private function makeImage(GalleryAlbum $album, array $overrides = []): GalleryImage
    {
        return $album->images()->create(array_merge([
            'file_path' => 'gallery-images/'.uniqid().'.jpg',
            'file_name' => 'img.jpg', 'mime_type' => 'image/jpeg', 'file_size' => 100,
            'alt_text_ar' => 'نص بديل', 'alt_text_en' => 'alt text',
            'caption_ar' => 'تعليق', 'caption_en' => 'caption',
            'sort_order' => 0,
        ], $overrides));
    }

    public function test_list_exposes_only_published_albums_with_counts(): void
    {
        $published = $this->makeAlbum();
        $this->makeImage($published);
        $this->makeImage($published);
        $this->makeAlbum(['status' => 'draft']);
        $this->makeAlbum(['status' => 'archived']);

        $json = $this->getJson('/api/v1/public/gallery/albums')->assertOk()->json();
        $this->assertSame(1, $json['meta']['total']);
        $this->assertSame($published->id, $json['data'][0]['id']);
        $this->assertSame(2, $json['data'][0]['images_count']);
        foreach (['created_by', 'sort_order', 'status'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $json['data'][0]);
        }
    }

    public function test_detail_and_images_hidden_for_unpublished_albums(): void
    {
        $draft = $this->makeAlbum(['status' => 'draft']);
        $archived = $this->makeAlbum(['status' => 'archived']);
        $this->makeImage($draft);

        foreach ([$draft->id, $archived->id] as $id) {
            $this->getJson("/api/v1/public/gallery/albums/{$id}")->assertNotFound();
            $this->getJson("/api/v1/public/gallery/albums/{$id}/images")->assertNotFound();
        }
    }

    public function test_images_endpoint_paginates_and_exposes_public_fields_only(): void
    {
        $album = $this->makeAlbum();
        foreach (range(1, 3) as $i) {
            $this->makeImage($album, ['sort_order' => $i]);
        }

        $json = $this->getJson("/api/v1/public/gallery/albums/{$album->id}/images?per_page=2")->assertOk()->json();
        $this->assertSame(3, $json['meta']['total']);
        $this->assertCount(2, $json['data']);
        $image = $json['data'][0];
        $this->assertSame('نص بديل', $image['alt_ar']);
        $this->assertSame('caption', $image['caption_en']);
        $this->assertStringStartsWith('/api/v1/files/gallery-images/', $image['url']);
        foreach (['uploaded_by', 'file_path', 'file_size', 'is_featured'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $image);
        }

        $page2 = $this->getJson("/api/v1/public/gallery/albums/{$album->id}/images?per_page=2&page=2")->assertOk()->json();
        $this->assertCount(1, $page2['data']);
    }

    public function test_gallery_files_hidden_for_unpublished_albums(): void
    {
        Storage::fake('public');
        $disk = Storage::disk('public');
        foreach (['pub.jpg', 'draft.jpg', 'pub-cover.jpg', 'draft-cover.jpg'] as $f) {
            $disk->put("gallery-images/{$f}", 'x');
            $disk->put("gallery-covers/{$f}", 'x');
        }

        $published = $this->makeAlbum(['cover_image_path' => 'gallery-covers/pub-cover.jpg']);
        $draft = $this->makeAlbum(['status' => 'draft', 'cover_image_path' => 'gallery-covers/draft-cover.jpg']);
        $this->makeImage($published, ['file_path' => 'gallery-images/pub.jpg']);
        $this->makeImage($draft, ['file_path' => 'gallery-images/draft.jpg']);

        $this->get('/api/v1/files/gallery-images/pub.jpg')->assertOk();
        $this->get('/api/v1/files/gallery-covers/pub-cover.jpg')->assertOk();
        $this->get('/api/v1/files/gallery-images/draft.jpg')->assertNotFound();
        $this->get('/api/v1/files/gallery-covers/draft-cover.jpg')->assertNotFound();

        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'admin')->first()->id,
        ]);
        $this->get('/api/v1/files/gallery-images/draft.jpg', $this->headers($admin))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }
}
