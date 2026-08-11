<?php

namespace Tests\Feature;

use App\Models\GalleryAlbum;
use App\Models\GalleryImage;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryManagementApiTest extends TestCase
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

    private function albumPayload(array $overrides = []): array
    {
        return array_merge([
            'title_ar' => 'ألبوم تجريبي',
            'title_en' => 'Test Album',
            'description_ar' => 'وصف عربي',
            'description_en' => 'English description',
            'status' => 'published',
            'remove_cover' => '0',
        ], $overrides);
    }

    private function makeAlbum(array $overrides = []): GalleryAlbum
    {
        $album = new GalleryAlbum(array_merge([
            'title_ar' => 'ألبوم',
            'title_en' => 'Existing Album',
            'status' => 'draft',
            'sort_order' => 1,
        ], $overrides));
        $album->slug = 'existing-album-'.uniqid();
        $album->created_by = $this->admin->id;
        $album->save();

        return $album;
    }

    private function makeImage(GalleryAlbum $album, array $overrides = []): GalleryImage
    {
        return $album->images()->create(array_merge([
            'uploaded_by' => $this->admin->id,
            'file_path' => 'gallery-images/'.uniqid().'.jpg',
            'alt_text_ar' => 'نص بديل',
            'alt_text_en' => 'Alt text',
            'sort_order' => ($album->images()->max('sort_order') ?? 0) + 1,
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/gallery/albums')->assertStatus(401);

        $album = $this->makeAlbum();

        $this->getJson('/api/v1/gallery/albums', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/gallery/albums', $this->albumPayload(), $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/gallery/albums/{$album->id}/images", $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/gallery/albums', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/gallery/albums', $this->headers($this->admin))->assertOk();
    }

    public function test_create_album_with_cover(): void
    {
        Storage::fake('public');

        $response = $this->post('/api/v1/gallery/albums', $this->albumPayload([
            'cover_image' => UploadedFile::fake()->image('cover.png', 600, 400),
        ]), $this->headers($this->admin));

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title_en', 'Test Album')
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.images_count', 0);

        $album = GalleryAlbum::first();
        $this->assertStringStartsWith('gallery-covers/', $album->cover_image_path);
        Storage::disk('public')->assertExists($album->cover_image_path);
        $this->assertSame('/api/v1/files/'.$album->cover_image_path, $response->json('data.cover_image_url'));
        $this->assertNotNull($album->published_at);
    }

    public function test_album_validation(): void
    {
        $this->postJson('/api/v1/gallery/albums', [], $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title_ar', 'title_en', 'status']);

        $this->postJson('/api/v1/gallery/albums', $this->albumPayload(['status' => 'bogus']), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        // Oversized file (>5MB) rejected.
        $this->post('/api/v1/gallery/albums', $this->albumPayload([
            'cover_image' => UploadedFile::fake()->create('big.jpg', 6000, 'image/jpeg'),
        ]), $this->headers($this->admin))->assertStatus(422);

        // Non-image rejected.
        $this->post('/api/v1/gallery/albums', $this->albumPayload([
            'cover_image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]), $this->headers($this->admin))->assertStatus(422);
    }

    public function test_update_album_and_status_and_delete(): void
    {
        Storage::fake('public');
        $album = $this->makeAlbum();

        $this->post("/api/v1/gallery/albums/{$album->id}", array_merge(
            $this->albumPayload(['title_en' => 'Updated Album', 'status' => 'draft']),
            ['_method' => 'PUT'],
        ), $this->headers($this->admin))->assertOk()
            ->assertJsonPath('data.title_en', 'Updated Album');

        $this->patchJson("/api/v1/gallery/albums/{$album->id}/status", ['status' => 'published'], $this->headers($this->admin))
            ->assertOk()->assertJsonPath('data.status', 'published');

        $this->patchJson("/api/v1/gallery/albums/{$album->id}/status", ['status' => 'archived'], $this->headers($this->admin))
            ->assertOk()->assertJsonPath('data.status', 'archived');

        $image = $this->makeImage($album);
        Storage::disk('public')->put($image->file_path, 'x');

        $this->deleteJson("/api/v1/gallery/albums/{$album->id}", [], $this->headers($this->admin))->assertOk();
        Storage::disk('public')->assertMissing($image->file_path);
        $this->assertSoftDeleted('gallery_albums', ['id' => $album->id]);
    }

    public function test_list_search_filter_pagination(): void
    {
        $this->makeAlbum(['title_en' => 'Summer Camp', 'status' => 'published']);
        $this->makeAlbum(['title_en' => 'Winter Retreat', 'status' => 'draft']);
        $this->makeAlbum(['title_en' => 'Charity Gala', 'status' => 'archived']);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/gallery/albums?search=summer', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title_en', 'Summer Camp');

        $this->getJson('/api/v1/gallery/albums?status=draft', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/gallery/albums?per_page=2&page=2', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_multi_upload_stores_files_and_adopts_first_cover(): void
    {
        Storage::fake('public');
        $album = $this->makeAlbum();

        $response = $this->post("/api/v1/gallery/albums/{$album->id}/images", [
            'images' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.png'),
            ],
            'alt_ar' => ['بديل ١', 'بديل ٢'],
            'alt_en' => ['Alt one', 'Alt two'],
        ], $this->headers($this->admin));

        $response->assertStatus(201);
        $this->assertCount(2, $response->json('data'));
        $this->assertTrue($response->json('data.0.is_cover'));
        $this->assertFalse($response->json('data.1.is_cover'));
        $this->assertStringStartsWith('/api/v1/files/gallery-images/', $response->json('data.0.url'));

        foreach (GalleryImage::all() as $image) {
            Storage::disk('public')->assertExists($image->file_path);
        }

        $album->refresh();
        $this->assertSame(GalleryImage::orderBy('id')->first()->file_path, $album->cover_image_path);

        // Missing alt text rejected.
        $this->post("/api/v1/gallery/albums/{$album->id}/images", [
            'images' => [UploadedFile::fake()->image('three.jpg')],
            'alt_ar' => [''],
            'alt_en' => [''],
        ], $this->headers($this->admin))->assertStatus(422);

        // Custom album cover is NOT displaced by uploads.
        $custom = $this->makeAlbum(['cover_image_path' => 'gallery-covers/custom.png']);
        $this->post("/api/v1/gallery/albums/{$custom->id}/images", [
            'images' => [UploadedFile::fake()->image('x.jpg')],
            'alt_ar' => ['بديل'],
            'alt_en' => ['Alt'],
        ], $this->headers($this->admin))->assertStatus(201);
        $this->assertSame('gallery-covers/custom.png', $custom->fresh()->cover_image_path);
        $this->assertFalse($custom->images()->first()->is_cover);
    }

    public function test_update_image_metadata_and_replace_file(): void
    {
        Storage::fake('public');
        $album = $this->makeAlbum();
        $image = $this->makeImage($album, ['is_cover' => true]);
        $album->update(['cover_image_path' => $image->file_path]);
        Storage::disk('public')->put($image->file_path, 'x');
        $oldPath = $image->file_path;

        $this->post("/api/v1/gallery/images/{$image->id}", [
            '_method' => 'PUT',
            'title_ar' => 'عنوان',
            'title_en' => 'Title',
            'alt_ar' => 'بديل جديد',
            'alt_en' => 'New alt',
            'caption_ar' => 'تعليق',
            'caption_en' => 'Caption',
            'image' => UploadedFile::fake()->image('replacement.webp'),
        ], $this->headers($this->admin))->assertOk()
            ->assertJsonPath('data.alt_en', 'New alt')
            ->assertJsonPath('data.caption_en', 'Caption');

        $image->refresh();
        $this->assertNotSame($oldPath, $image->file_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($image->file_path);
        // Image-backed album cover follows the replaced file.
        $this->assertSame($image->file_path, $album->fresh()->cover_image_path);
    }

    public function test_set_cover_replaces_previous_cover(): void
    {
        $album = $this->makeAlbum();
        $first = $this->makeImage($album, ['is_cover' => true]);
        $album->update(['cover_image_path' => $first->file_path]);
        $second = $this->makeImage($album);

        $this->patchJson("/api/v1/gallery/images/{$second->id}/cover", [], $this->headers($this->admin))
            ->assertOk()->assertJsonPath('data.is_cover', true);

        $this->assertFalse($first->fresh()->is_cover);
        $this->assertTrue($second->fresh()->is_cover);
        $this->assertSame($second->file_path, $album->fresh()->cover_image_path);
        $this->assertSame(1, $album->images()->where('is_cover', true)->count());
    }

    public function test_delete_cover_image_promotes_next(): void
    {
        Storage::fake('public');
        $album = $this->makeAlbum();
        $first = $this->makeImage($album, ['is_cover' => true]);
        $album->update(['cover_image_path' => $first->file_path]);
        $second = $this->makeImage($album);
        Storage::disk('public')->put($first->file_path, 'x');

        $this->deleteJson("/api/v1/gallery/images/{$first->id}", [], $this->headers($this->admin))->assertOk();

        Storage::disk('public')->assertMissing($first->file_path);
        $this->assertTrue($second->fresh()->is_cover);
        $this->assertSame($second->file_path, $album->fresh()->cover_image_path);

        // Deleting the last image leaves the album coverless.
        $this->deleteJson("/api/v1/gallery/images/{$second->id}", [], $this->headers($this->admin))->assertOk();
        $this->assertNull($album->fresh()->cover_image_path);
    }

    public function test_reorder_albums_and_images(): void
    {
        $a = $this->makeAlbum(['sort_order' => 1]);
        $b = $this->makeAlbum(['sort_order' => 2]);
        $c = $this->makeAlbum(['sort_order' => 3]);

        $this->patchJson('/api/v1/gallery/albums/reorder', [
            'order' => [$c->id, $a->id, $b->id],
        ], $this->headers($this->admin))->assertOk();

        $this->assertSame(1, $c->fresh()->sort_order);
        $this->assertSame(2, $a->fresh()->sort_order);
        $this->assertSame(3, $b->fresh()->sort_order);

        $i1 = $this->makeImage($a);
        $i2 = $this->makeImage($a);

        $this->patchJson("/api/v1/gallery/albums/{$a->id}/images/reorder", [
            'order' => [$i2->id, $i1->id],
        ], $this->headers($this->admin))->assertOk();

        $this->assertSame(1, $i2->fresh()->sort_order);
        $this->assertSame(2, $i1->fresh()->sort_order);

        $ordered = $this->getJson("/api/v1/gallery/albums/{$a->id}/images", $this->headers($this->admin))
            ->assertOk()->json('data');
        $this->assertSame([$i2->id, $i1->id], array_column($ordered, 'id'));
    }
}
