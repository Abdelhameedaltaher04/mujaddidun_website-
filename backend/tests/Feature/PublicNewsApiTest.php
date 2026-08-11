<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicNewsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeNews(array $overrides = []): News
    {
        static $n = 0;
        $n++;

        return News::create(array_merge([
            'title_ar' => "خبر {$n}",
            'title_en' => "News {$n}",
            'slug' => "news-{$n}-".uniqid(),
            'excerpt_ar' => "مقتطف {$n}",
            'excerpt_en' => "Excerpt {$n}",
            'content_ar' => "محتوى {$n}",
            'content_en' => "Content {$n}",
            'status' => 'published',
            'published_at' => now()->subDays($n),
        ], $overrides));
    }

    public function test_list_returns_only_published_news_without_private_fields(): void
    {
        $category = NewsCategory::create(['slug' => 'activities', 'name_ar' => 'أنشطة', 'name_en' => 'Activities']);
        $published = $this->makeNews(['news_category_id' => $category->id, 'cover_image_path' => 'news-covers/a.png']);
        $this->makeNews(['status' => 'draft']);
        $this->makeNews(['status' => 'archived']);

        $response = $this->getJson('/api/v1/public/news')->assertOk();

        $items = $response->json('data');
        $this->assertCount(1, $items);
        $this->assertSame($published->id, $items[0]['id']);
        $this->assertSame('activities', $items[0]['category']);
        $this->assertSame('/api/v1/files/news-covers/a.png', $items[0]['featured_image_url']);
        $this->assertArrayNotHasKey('status', $items[0]);
        $this->assertArrayNotHasKey('content_ar', $items[0]);
        $this->assertArrayNotHasKey('author_id', $items[0]);
        $this->assertArrayNotHasKey('views_count', $items[0]);
        $this->assertSame(1, $response->json('meta.total'));
    }

    public function test_list_is_paginated_and_ordered_newest_first(): void
    {
        for ($i = 0; $i < 12; $i++) {
            $this->makeNews();
        }

        $page1 = $this->getJson('/api/v1/public/news?per_page=9')->assertOk();
        $this->assertCount(9, $page1->json('data'));
        $this->assertSame(2, $page1->json('meta.last_page'));

        $dates = array_column($page1->json('data'), 'published_at');
        $sorted = $dates;
        rsort($sorted);
        $this->assertSame($sorted, $dates);

        $page2 = $this->getJson('/api/v1/public/news?per_page=9&page=2')->assertOk();
        $this->assertCount(3, $page2->json('data'));
    }

    public function test_detail_returns_full_content_and_related_published_only(): void
    {
        $category = NewsCategory::create(['slug' => 'programs', 'name_ar' => 'برامج', 'name_en' => 'Programs']);
        $main = $this->makeNews(['news_category_id' => $category->id, 'author_name' => 'فريق مجددون']);
        $sameCat = $this->makeNews(['news_category_id' => $category->id]);
        $other = $this->makeNews();
        $this->makeNews(['news_category_id' => $category->id, 'status' => 'draft']);

        $response = $this->getJson("/api/v1/public/news/{$main->id}")->assertOk();
        $data = $response->json('data');

        $this->assertSame($main->content_ar, $data['content_ar']);
        $this->assertSame('فريق مجددون', $data['author']);
        $this->assertArrayNotHasKey('status', $data);

        $relatedIds = array_column($data['related'], 'id');
        $this->assertCount(2, $relatedIds);
        // Same-category published article is preferred first.
        $this->assertSame($sameCat->id, $relatedIds[0]);
        $this->assertContains($other->id, $relatedIds);
        $this->assertNotContains($main->id, $relatedIds);
    }

    public function test_cover_images_of_unpublished_articles_are_hidden_from_public(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        $disk->put('news-covers/published.png', 'png');
        $disk->put('news-covers/draft.png', 'png');
        $disk->put('news-covers/orphan.png', 'png');

        $this->makeNews(['cover_image_path' => 'news-covers/published.png']);
        $this->makeNews(['cover_image_path' => 'news-covers/draft.png', 'status' => 'draft']);

        $this->get('/api/v1/files/news-covers/published.png')->assertOk();
        $this->get('/api/v1/files/news-covers/draft.png')->assertNotFound();
        $this->get('/api/v1/files/news-covers/orphan.png')->assertNotFound();

        // Staff with a bearer token can still preview draft covers.
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $admin = \App\Models\User::factory()->create([
            'role_id' => \App\Models\Role::where('slug', 'admin')->first()->id,
        ]);
        $token = $admin->createToken('test')->plainTextToken;
        $this->get('/api/v1/files/news-covers/draft.png', [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();
    }

    public function test_draft_archived_and_missing_articles_return_404(): void
    {
        $draft = $this->makeNews(['status' => 'draft']);
        $archived = $this->makeNews(['status' => 'archived']);

        $this->getJson("/api/v1/public/news/{$draft->id}")->assertNotFound();
        $this->getJson("/api/v1/public/news/{$archived->id}")->assertNotFound();
        $this->getJson('/api/v1/public/news/999999')->assertNotFound();
    }
}
