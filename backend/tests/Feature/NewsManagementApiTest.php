<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsCategory;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\NewsCategorySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NewsManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $moderator;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(NewsCategorySeeder::class);

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
            'title_ar' => 'خبر تجريبي',
            'title_en' => 'Test Article',
            'excerpt_ar' => 'ملخص عربي',
            'excerpt_en' => 'English excerpt',
            'content_ar' => '<p>محتوى</p>',
            'content_en' => '<p>Content</p>',
            'category' => 'announcements',
            'author' => 'فريق مجددون',
            'status' => 'draft',
            'remove_featured_image' => '0',
        ], $overrides);
    }

    private function makeArticle(array $overrides = []): News
    {
        $article = new News(array_merge([
            'title_ar' => 'خبر',
            'title_en' => 'Existing Article',
            'excerpt_ar' => 'ملخص',
            'excerpt_en' => 'Excerpt',
            'content_ar' => '<p>a</p>',
            'content_en' => '<p>b</p>',
            'news_category_id' => NewsCategory::where('slug', 'activities')->firstOrFail()->id,
            'author_name' => 'إدارة الإعلام',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $overrides));
        $article->slug = 'existing-article-'.uniqid();
        $article->author_id = $this->admin->id;
        $article->save();

        return $article;
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/news')->assertStatus(401);
        $this->getJson('/api/v1/news', $this->headers($this->member))->assertStatus(403);
        // The guard caches the resolved user between in-test requests.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/news', $this->headers($this->moderator))->assertStatus(200);
        $this->app['auth']->forgetGuards();

        $article = $this->makeArticle();
        $this->postJson('/api/v1/news', $this->payload(), $this->headers($this->member))->assertStatus(403);
        $this->deleteJson('/api/v1/news/'.$article->id, [], $this->headers($this->member))->assertStatus(403);
    }

    public function test_moderator_can_manage_news(): void
    {
        $response = $this->postJson('/api/v1/news', $this->payload(), $this->headers($this->moderator))
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.category', 'announcements')
            ->assertJsonPath('data.author', 'فريق مجددون')
            ->assertJsonPath('data.published_at', null);

        $id = $response->json('data.id');
        $this->patchJson("/api/v1/news/{$id}/publish", [], $this->headers($this->moderator))
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'published');
        $this->assertNotNull(News::find($id)->published_at);
    }

    public function test_list_search_filters_and_pagination(): void
    {
        $this->makeArticle(['title_en' => 'Ramadan Campaign', 'title_ar' => 'حملة رمضان']);
        $this->makeArticle(['status' => 'draft', 'published_at' => null]);
        $this->makeArticle([
            'news_category_id' => NewsCategory::where('slug', 'press')->firstOrFail()->id,
        ]);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/news?search=ramadan', $headers)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title_en', 'Ramadan Campaign');

        $this->getJson('/api/v1/news?search=رمضان', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/news?category=press', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/news?status=draft', $headers)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/news?per_page=2&page=2', $headers)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.total', 3);

        $from = now()->subHours(30)->toDateString();
        $this->getJson("/api/v1/news?published_from={$from}", $headers)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_create_with_image_and_remove_on_update(): void
    {
        Storage::fake('public');
        $headers = $this->headers($this->admin);

        $create = $this->post('/api/v1/news', $this->payload([
            'featured_image' => UploadedFile::fake()->image('cover.jpg', 1200, 800),
        ]), $headers + ['Accept' => 'application/json']);

        $create->assertStatus(201);
        $url = $create->json('data.featured_image_url');
        $this->assertStringStartsWith('/api/v1/files/news-covers/', $url);

        $id = $create->json('data.id');
        $path = News::find($id)->cover_image_path;
        Storage::disk('public')->assertExists($path);

        // Update with remove flag clears image and deletes the file.
        $this->post("/api/v1/news/{$id}", $this->payload([
            '_method' => 'PUT',
            'remove_featured_image' => '1',
        ]), $headers + ['Accept' => 'application/json'])
            ->assertStatus(200)
            ->assertJsonPath('data.featured_image_url', null);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_image_validation(): void
    {
        $headers = $this->headers($this->admin) + ['Accept' => 'application/json'];

        $this->post('/api/v1/news', $this->payload([
            'featured_image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]), $headers)->assertStatus(422)->assertJsonStructure(['errors' => ['featured_image']]);

        $this->post('/api/v1/news', $this->payload([
            'featured_image' => UploadedFile::fake()->image('big.jpg')->size(6000),
        ]), $headers)->assertStatus(422)->assertJsonStructure(['errors' => ['featured_image']]);
    }

    public function test_validation_errors_envelope(): void
    {
        $this->postJson('/api/v1/news', $this->payload([
            'title_ar' => '',
            'category' => 'bogus',
        ]), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJson(['success' => false, 'message' => 'Validation failed.'])
            ->assertJsonStructure(['errors' => ['title_ar', 'category']]);
    }

    public function test_publish_unpublish_archive_lifecycle(): void
    {
        $headers = $this->headers($this->admin);
        $article = $this->makeArticle(['status' => 'draft', 'published_at' => null]);

        $this->patchJson("/api/v1/news/{$article->id}/publish", [], $headers)
            ->assertJsonPath('data.status', 'published');
        $publishedAt = News::find($article->id)->published_at;
        $this->assertNotNull($publishedAt);

        // Unpublish keeps the original publication date.
        $this->patchJson("/api/v1/news/{$article->id}/unpublish", [], $headers)
            ->assertJsonPath('data.status', 'draft');
        $this->assertEquals($publishedAt, News::find($article->id)->published_at);

        $this->patchJson("/api/v1/news/{$article->id}/archive", [], $headers)
            ->assertJsonPath('data.status', 'archived');
    }

    public function test_delete_soft_deletes(): void
    {
        $headers = $this->headers($this->admin);
        $article = $this->makeArticle();

        $this->deleteJson('/api/v1/news/'.$article->id, [], $headers)
            ->assertStatus(200)->assertJson(['success' => true]);

        $this->getJson('/api/v1/news/'.$article->id, $headers)->assertStatus(404);
        $this->assertSoftDeleted('news', ['id' => $article->id]);
    }

    public function test_public_file_route_serves_and_rejects_traversal(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('news-covers/x.jpg', 'fake-image-bytes');
        Storage::disk('public')->put('profile-avatars/secret.jpg', 'avatar-bytes');

        $this->get('/api/v1/files/news-covers/x.jpg')->assertStatus(200);
        $this->get('/api/v1/files/news-covers/missing.jpg')->assertStatus(404);
        $this->get('/api/v1/files/..%2F..%2F.env')->assertStatus(404);
        // Only whitelisted directories are exposed.
        $this->get('/api/v1/files/profile-avatars/secret.jpg')->assertStatus(404);
        $this->get('/api/v1/files/news-covers/..%2F..%2F.env')->assertStatus(404);
    }

    public function test_update_published_at_semantics(): void
    {
        $headers = $this->headers($this->admin);
        $original = now()->subDays(3)->startOfSecond();
        $article = $this->makeArticle(['published_at' => $original]);

        // Omitted field preserves the stored date.
        $this->putJson('/api/v1/news/'.$article->id, $this->payload([
            'status' => 'published',
        ]), $headers)->assertStatus(200);
        $this->assertTrue($original->equalTo(News::find($article->id)->published_at));

        // Explicit empty value clears it (published articles get now()).
        $this->putJson('/api/v1/news/'.$article->id, $this->payload([
            'status' => 'draft',
            'published_at' => '',
        ]), $headers)->assertStatus(200);
        $this->assertNull(News::find($article->id)->published_at);
    }

    public function test_delete_removes_cover_file(): void
    {
        Storage::fake('public');
        $headers = $this->headers($this->admin);

        $create = $this->post('/api/v1/news', $this->payload([
            'featured_image' => UploadedFile::fake()->image('cover.jpg'),
        ]), $headers + ['Accept' => 'application/json'])->assertStatus(201);

        $id = $create->json('data.id');
        $path = News::find($id)->cover_image_path;
        Storage::disk('public')->assertExists($path);

        $this->deleteJson('/api/v1/news/'.$id, [], $headers)->assertStatus(200);
        Storage::disk('public')->assertMissing($path);
    }
}
