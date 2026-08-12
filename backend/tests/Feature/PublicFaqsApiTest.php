<?php

namespace Tests\Feature;

use App\Models\Faq;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicFaqsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function makeFaq(array $overrides = []): Faq
    {
        return Faq::create(array_merge([
            'question_ar' => 'سؤال', 'question_en' => 'Question',
            'answer_ar' => 'إجابة', 'answer_en' => 'Answer',
            'category' => 'general', 'status' => 'published',
            'sort_order' => 0, 'published_at' => now(),
        ], $overrides));
    }

    public function test_list_exposes_only_published_faqs_in_admin_order(): void
    {
        $second = $this->makeFaq(['sort_order' => 2]);
        $first = $this->makeFaq(['sort_order' => 1]);
        $this->makeFaq(['status' => 'draft']);
        $this->makeFaq(['status' => 'archived']);

        $data = $this->getJson('/api/v1/public/faqs')->assertOk()->json('data');
        $this->assertSame([$first->id, $second->id], array_column($data, 'id'));

        $row = $data[0];
        $this->assertSame('سؤال', $row['question_ar']);
        $this->assertSame('Question', $row['question_en']);
        $this->assertSame('إجابة', $row['answer_ar']);
        $this->assertSame('Answer', $row['answer_en']);
        $this->assertSame('general', $row['category']);
        $this->assertSame(1, $row['display_order']);
        foreach (['status', 'sort_order', 'published_at', 'created_at', 'updated_at'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $row);
        }
    }

    public function test_empty_list_when_no_published_faqs(): void
    {
        $this->makeFaq(['status' => 'draft']);

        $this->getJson('/api/v1/public/faqs')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_endpoint_requires_no_authentication(): void
    {
        $this->makeFaq();

        $this->getJson('/api/v1/public/faqs')->assertOk()->assertJsonCount(1, 'data');
    }
}
