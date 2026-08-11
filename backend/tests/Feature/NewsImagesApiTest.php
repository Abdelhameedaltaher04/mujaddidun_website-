<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsImage;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NewsImagesApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $volunteer;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->seed(RoleSeeder::class);
        $this->admin = User::factory()->create(['role_id' => Role::where('slug', 'admin')->first()->id]);
        $this->volunteer = User::factory()->create(['role_id' => Role::where('slug', 'volunteer')->first()->id]);
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('t')->plainTextToken];
    }

    private function makeNews(array $overrides = []): News
    {
        return News::create(array_merge([
            'title_ar' => 'خبر', 'title_en' => 'Article', 'slug' => 'a-'.uniqid(),
            'content_ar' => 'محتوى', 'content_en' => 'content',
            'status' => 'published', 'published_at' => now(),
        ], $overrides));
    }

    public function test_upload_list_reorder_delete_flow(): void
    {
        $news = $this->makeNews();
        $headers = $this->headers($this->admin);

        $upload = $this->post("/api/v1/news/{$news->id}/images", [
            'images' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.png'),
            ],
            'alt_ar' => ['صورة أولى', 'صورة ثانية'],
            'alt_en' => ['First', 'Second'],
        ], $headers)->assertStatus(201);

        $ids = array_column($upload->json('data'), 'id');
        $this->assertCount(2, $ids);
        $this->assertSame('صورة أولى', $upload->json('data.0.alt_text_ar'));
        foreach (NewsImage::all() as $image) {
            Storage::disk('public')->assertExists($image->image);
        }

        // List preserves order.
        $list = $this->getJson("/api/v1/news/{$news->id}/images", $headers)->assertOk();
        $this->assertSame($ids, array_column($list->json('data'), 'id'));

        // Reorder (reversed).
        $reversed = array_reverse($ids);
        $this->patchJson("/api/v1/news/{$news->id}/images/reorder", ['order' => $reversed], $headers)->assertOk();
        $after = $this->getJson("/api/v1/news/{$news->id}/images", $headers)->json('data');
        $this->assertSame($reversed, array_column($after, 'id'));

        // Incomplete order set rejected.
        $this->patchJson("/api/v1/news/{$news->id}/images/reorder", ['order' => [$ids[0]]], $headers)->assertStatus(422);

        // Delete removes row and file.
        $victim = NewsImage::find($ids[0]);
        $this->deleteJson('/api/v1/news/images/'.$victim->id, [], $headers)->assertOk();
        $this->assertDatabaseMissing('news_images', ['id' => $victim->id]);
        Storage::disk('public')->assertMissing($victim->image);
    }

    public function test_validation_rejects_bad_type_and_oversize(): void
    {
        $news = $this->makeNews();
        $headers = $this->headers($this->admin);

        $this->post("/api/v1/news/{$news->id}/images", [
            'images' => [UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')],
        ], array_merge($headers, ['Accept' => 'application/json']))->assertStatus(422);

        $this->post("/api/v1/news/{$news->id}/images", [
            'images' => [UploadedFile::fake()->create('big.jpg', 6000, 'image/jpeg')],
        ], array_merge($headers, ['Accept' => 'application/json']))->assertStatus(422);
    }

    public function test_authorization_matrix(): void
    {
        $news = $this->makeNews();

        $this->postJson("/api/v1/news/{$news->id}/images", [])->assertStatus(401);

        $headers = $this->headers($this->volunteer);
        $this->post("/api/v1/news/{$news->id}/images", [
            'images' => [UploadedFile::fake()->image('x.jpg')],
        ], array_merge($headers, ['Accept' => 'application/json']))->assertStatus(403);
        $this->getJson("/api/v1/news/{$news->id}/images", $headers)->assertStatus(403);

        $image = $news->images()->create(['image' => 'news-images/x.jpg', 'display_order' => 1]);
        $this->deleteJson('/api/v1/news/images/'.$image->id, [], $headers)->assertStatus(403);
        $this->patchJson("/api/v1/news/{$news->id}/images/reorder", ['order' => [$image->id]], $headers)->assertStatus(403);
    }

    public function test_public_detail_includes_gallery_and_hides_unpublished_files(): void
    {
        $published = $this->makeNews();
        $draft = $this->makeNews(['status' => 'draft', 'published_at' => null]);

        Storage::disk('public')->put('news-images/pub.jpg', 'x');
        Storage::disk('public')->put('news-images/draft.jpg', 'x');
        $published->images()->create(['image' => 'news-images/pub.jpg', 'alt_text_ar' => 'وصف', 'display_order' => 1]);
        $draft->images()->create(['image' => 'news-images/draft.jpg', 'display_order' => 1]);

        $detail = $this->getJson("/api/v1/public/news/{$published->id}")->assertOk()->json('data');
        $this->assertCount(1, $detail['gallery_images']);
        $this->assertSame('/api/v1/files/news-images/pub.jpg', $detail['gallery_images'][0]['image']);
        $this->assertSame('وصف', $detail['gallery_images'][0]['alt_text_ar']);

        // Draft article detail is 404 and its files are unreachable publicly.
        $this->getJson("/api/v1/public/news/{$draft->id}")->assertStatus(404);
        $this->get('/api/v1/files/news-images/pub.jpg')->assertOk();
        $this->get('/api/v1/files/news-images/draft.jpg')->assertNotFound();

        // Archived behaves like draft.
        $published->update(['status' => 'archived']);
        $this->get('/api/v1/files/news-images/pub.jpg')->assertNotFound();

        // Staff can still preview — but the response must not be shared-cacheable.
        $this->get('/api/v1/files/news-images/draft.jpg', $this->headers($this->admin))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');

        // Public files stay publicly cacheable.
        $published->update(['status' => 'published']);
        $this->get('/api/v1/files/news-images/pub.jpg')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=86400, public');
    }

    public function test_deleting_article_cleans_up_gallery_rows_and_files(): void
    {
        $news = $this->makeNews();
        Storage::disk('public')->put('news-images/gone.jpg', 'x');
        $image = $news->images()->create(['image' => 'news-images/gone.jpg', 'display_order' => 1]);

        $this->deleteJson("/api/v1/news/{$news->id}", [], $this->headers($this->admin))->assertOk();

        $this->assertDatabaseMissing('news_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing('news-images/gone.jpg');
    }
}
