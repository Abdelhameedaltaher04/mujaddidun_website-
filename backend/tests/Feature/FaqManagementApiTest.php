<?php

namespace Tests\Feature;

use App\Models\Faq;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaqManagementApiTest extends TestCase
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
            'question_ar' => 'ما هي المنصة؟',
            'question_en' => 'What is the platform?',
            'answer_ar' => 'منصة مجددون.',
            'answer_en' => 'The Mujaddidun platform.',
            'category' => 'general',
            'display_order' => 1,
            'status' => 'published',
        ], $overrides);
    }

    private function makeFaq(array $overrides = []): Faq
    {
        return Faq::create(array_merge([
            'question_ar' => 'سؤال',
            'question_en' => 'Question',
            'answer_ar' => 'جواب',
            'answer_en' => 'Answer',
            'category' => null,
            'status' => 'draft',
            'sort_order' => (int) Faq::max('sort_order') + 1,
        ], $overrides));
    }

    public function test_auth_matrix(): void
    {
        $this->getJson('/api/v1/faqs')->assertStatus(401);

        $this->getJson('/api/v1/faqs', $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/faqs', $this->payload(), $this->headers($this->member))->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/faqs', $this->headers($this->moderator))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/faqs', $this->headers($this->admin))->assertOk();
    }

    public function test_create_and_shape(): void
    {
        $response = $this->postJson('/api/v1/faqs', $this->payload(), $this->headers($this->admin));

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.question_en', 'What is the platform?')
            ->assertJsonPath('data.category', 'general')
            ->assertJsonPath('data.display_order', 1)
            ->assertJsonPath('data.status', 'published');

        $this->assertNotNull(Faq::first()->published_at);

        // Draft creation leaves published_at empty; null category allowed.
        $this->postJson('/api/v1/faqs', $this->payload([
            'question_en' => 'Draft question',
            'category' => null,
            'status' => 'draft',
        ]), $this->headers($this->admin))->assertStatus(201)
            ->assertJsonPath('data.category', null);

        $this->assertNull(Faq::where('question_en', 'Draft question')->first()->published_at);
    }

    public function test_validation_rules(): void
    {
        $this->postJson('/api/v1/faqs', [], $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['question_ar', 'question_en', 'answer_ar', 'answer_en', 'display_order', 'status']);

        $this->postJson('/api/v1/faqs', $this->payload([
            'category' => 'bogus',
            'display_order' => 0,
            'status' => 'bogus',
        ]), $this->headers($this->admin))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category', 'display_order', 'status']);
    }

    public function test_update(): void
    {
        $faq = $this->makeFaq();

        $this->putJson("/api/v1/faqs/{$faq->id}", $this->payload([
            'question_en' => 'Updated question',
            'category' => 'membership',
            'display_order' => 5,
            'status' => 'published',
        ]), $this->headers($this->admin))
            ->assertOk()
            ->assertJsonPath('data.question_en', 'Updated question')
            ->assertJsonPath('data.category', 'membership')
            ->assertJsonPath('data.display_order', 5)
            ->assertJsonPath('data.status', 'published');

        $this->assertNotNull($faq->fresh()->published_at);
    }

    public function test_status_transitions(): void
    {
        $faq = $this->makeFaq(['status' => 'draft']);
        $headers = $this->headers($this->admin);

        $this->patchJson("/api/v1/faqs/{$faq->id}/status", ['status' => 'published'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'published');
        $this->assertNotNull($faq->fresh()->published_at);

        $this->patchJson("/api/v1/faqs/{$faq->id}/status", ['status' => 'draft'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'draft');

        $this->patchJson("/api/v1/faqs/{$faq->id}/status", ['status' => 'archived'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'archived');

        $this->patchJson("/api/v1/faqs/{$faq->id}/status", ['status' => 'bogus'], $headers)
            ->assertStatus(422);
    }

    public function test_list_search_filters_pagination(): void
    {
        $this->makeFaq(['question_en' => 'Alpha question', 'category' => 'general', 'status' => 'published']);
        $this->makeFaq(['question_en' => 'Beta question', 'category' => 'donations', 'status' => 'draft']);
        $this->makeFaq(['question_ar' => 'ما شروط العضوية؟', 'question_en' => 'Gamma question', 'category' => 'membership', 'status' => 'published']);

        $headers = $this->headers($this->admin);

        $this->getJson('/api/v1/faqs?search=alpha', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.question_en', 'Alpha question');

        $this->getJson('/api/v1/faqs?search='.urlencode('العضوية'), $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.question_en', 'Gamma question');

        $this->getJson('/api/v1/faqs?category=donations', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/faqs?status=draft', $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/faqs?per_page=2&page=2', $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_reorder_persists_and_validates_membership(): void
    {
        $a = $this->makeFaq(['sort_order' => 1]);
        $b = $this->makeFaq(['sort_order' => 2]);
        $c = $this->makeFaq(['sort_order' => 3]);
        $headers = $this->headers($this->admin);

        $response = $this->patchJson('/api/v1/faqs/reorder', [
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

        $this->patchJson('/api/v1/faqs/reorder', ['ids' => [$a->id]], $headers)
            ->assertStatus(422);
        $this->patchJson('/api/v1/faqs/reorder', ['ids' => [$a->id, $b->id, 999999]], $headers)
            ->assertStatus(422);

        $ordered = $this->getJson('/api/v1/faqs', $headers)->assertOk()->json('data');
        $this->assertSame([$c->id, $a->id, $b->id], array_column($ordered, 'id'));
    }

    public function test_delete_soft_deletes(): void
    {
        $faq = $this->makeFaq();

        $this->deleteJson("/api/v1/faqs/{$faq->id}", [], $this->headers($this->admin))->assertOk();

        $this->assertSoftDeleted('faqs', ['id' => $faq->id]);
    }
}
