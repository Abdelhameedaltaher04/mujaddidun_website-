<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReplyMail;
use App\Models\ContactMessage;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactMessageApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $moderator;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create(['role_id' => $this->roleId('admin')]);
        $this->moderator = User::factory()->create(['role_id' => $this->roleId('moderator')]);
        $this->member = User::factory()->create(['role_id' => $this->roleId('user')]);
    }

    private function roleId(string $slug): int
    {
        return (int) \App\Models\Role::where('slug', $slug)->value('id');
    }

    private function tokenFor(User $user): string
    {
        $this->app['auth']->forgetGuards();

        return $user->createToken('test')->plainTextToken;
    }

    private function makeMessage(array $attributes = []): ContactMessage
    {
        return ContactMessage::create(array_merge([
            'name' => 'سالم الحمد',
            'email' => 'salem@example.com',
            'phone' => '+962790000001',
            'subject' => 'استفسار عن التطوع',
            'message' => 'أرغب بالانضمام إلى برامجكم التطوعية.',
            'status' => 'new',
        ], $attributes));
    }

    public function test_authorization_matrix(): void
    {
        $message = $this->makeMessage();

        // Unauthenticated → 401.
        $this->getJson('/api/v1/contact-messages')->assertUnauthorized();
        $this->getJson("/api/v1/contact-messages/{$message->id}")->assertUnauthorized();
        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", [])->assertUnauthorized();

        // Member → 403 (private data is not accessible).
        $memberToken = $this->tokenFor($this->member);
        foreach ([
            ['getJson', '/api/v1/contact-messages', null],
            ['getJson', '/api/v1/contact-messages/statistics', null],
            ['getJson', "/api/v1/contact-messages/{$message->id}", null],
            ['patchJson', "/api/v1/contact-messages/{$message->id}/read", ['is_read' => true]],
            ['patchJson', "/api/v1/contact-messages/{$message->id}/status", ['status' => 'in_progress']],
            ['patchJson', "/api/v1/contact-messages/{$message->id}/archive", null],
            ['postJson', "/api/v1/contact-messages/{$message->id}/reply", ['subject' => 'x', 'body_html' => 'y']],
            ['deleteJson', "/api/v1/contact-messages/{$message->id}", null],
        ] as [$method, $uri, $payload]) {
            $this->app['auth']->forgetGuards();
            $response = $method === 'getJson'
                ? $this->getJson($uri, ['Authorization' => "Bearer {$memberToken}"])
                : $this->{$method}($uri, $payload ?? [], ['Authorization' => "Bearer {$memberToken}"]);
            $response->assertForbidden();
        }

        // Moderator can access (inbox staff).
        $modToken = $this->tokenFor($this->moderator);
        $this->getJson('/api/v1/contact-messages', ['Authorization' => "Bearer {$modToken}"])->assertOk();
    }

    public function test_list_shape_search_filters_and_pagination(): void
    {
        $read = $this->makeMessage(['name' => 'Lena Haddad', 'email' => 'lena@example.com', 'subject' => 'Partnership question', 'read_at' => now(), 'status' => 'in_progress']);
        $this->makeMessage(['name' => 'نور الدين', 'email' => 'nour@example.com', 'subject' => 'شكوى', 'status' => 'resolved', 'read_at' => now()]);
        $this->makeMessage(['name' => 'Sami 100% Match', 'email' => 'sami@example.com', 'subject' => 'Donation receipt']);

        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        // Shape.
        $response = $this->getJson('/api/v1/contact-messages?per_page=2', $auth)->assertOk();
        $response->assertJsonStructure([
            'success', 'message',
            'data' => [['id', 'sender_name', 'email', 'phone', 'subject', 'body', 'is_read', 'read_at', 'status', 'received_at', 'created_at', 'updated_at']],
            'meta' => ['current_page', 'last_page', 'per_page', 'total', 'from', 'to'],
        ]);
        $this->assertSame(2, count($response->json('data')));
        $this->assertSame(3, $response->json('meta.total'));
        $this->assertSame(2, $response->json('meta.last_page'));

        // Search by name (Arabic), email, subject; escaped LIKE.
        $this->assertSame(1, count($this->getJson('/api/v1/contact-messages?search=' . urlencode('نور'), $auth)->json('data')));
        $this->assertSame(1, count($this->getJson('/api/v1/contact-messages?search=lena@', $auth)->json('data')));
        $this->assertSame(1, count($this->getJson('/api/v1/contact-messages?search=Partnership', $auth)->json('data')));
        $this->assertSame(1, count($this->getJson('/api/v1/contact-messages?search=' . urlencode('100%'), $auth)->json('data')));

        // Read filter.
        $this->assertSame(2, count($this->getJson('/api/v1/contact-messages?read=true', $auth)->json('data')));
        $this->assertSame(1, count($this->getJson('/api/v1/contact-messages?read=false', $auth)->json('data')));

        // Status filter.
        $data = $this->getJson('/api/v1/contact-messages?status=in_progress', $auth)->json('data');
        $this->assertSame([$read->id], array_column($data, 'id'));

        // Lenient dates: malformed ignored, inverted range → empty, not 422.
        $this->getJson('/api/v1/contact-messages?date_from=2026-8-1', $auth)->assertOk();
        $this->assertSame(0, count($this->getJson('/api/v1/contact-messages?date_from=2030-01-02&date_to=2030-01-01', $auth)->json('data')));
        $this->assertSame(3, count($this->getJson('/api/v1/contact-messages?date_from=' . now()->toDateString(), $auth)->json('data')));
    }

    public function test_statistics(): void
    {
        $this->makeMessage();
        $this->makeMessage(['read_at' => now(), 'status' => 'in_progress']);
        $this->makeMessage(['read_at' => now(), 'status' => 'resolved']);
        $this->makeMessage(['read_at' => now(), 'status' => 'archived']);

        $token = $this->tokenFor($this->admin);
        $this->getJson('/api/v1/contact-messages/statistics', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonPath('data.total', 4)
            ->assertJsonPath('data.unread', 1)
            ->assertJsonPath('data.in_progress', 1)
            ->assertJsonPath('data.resolved', 1);
    }

    public function test_read_toggle_preserves_first_read_timestamp(): void
    {
        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        $first = $this->patchJson("/api/v1/contact-messages/{$message->id}/read", ['is_read' => true], $auth)
            ->assertOk()->json('data.read_at');
        $this->assertNotNull($first);

        // Marking read again keeps the original timestamp.
        $again = $this->patchJson("/api/v1/contact-messages/{$message->id}/read", ['is_read' => true], $auth)->json('data.read_at');
        $this->assertSame($first, $again);

        // Unread clears it.
        $this->patchJson("/api/v1/contact-messages/{$message->id}/read", ['is_read' => false], $auth)
            ->assertOk()->assertJsonPath('data.is_read', false)->assertJsonPath('data.read_at', null);

        $this->patchJson("/api/v1/contact-messages/{$message->id}/read", ['is_read' => 'maybe'], $auth)->assertStatus(422);
    }

    public function test_status_transitions_and_archive(): void
    {
        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'in_progress'], $auth)
            ->assertOk()->assertJsonPath('data.status', 'in_progress');
        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'resolved'], $auth)
            ->assertOk()->assertJsonPath('data.status', 'resolved');

        // Same-state transition rejected.
        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'resolved'], $auth)->assertStatus(422);
        // Unknown / archived via status endpoint rejected.
        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'archived'], $auth)->assertStatus(422);
        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'spam'], $auth)->assertStatus(422);

        // Archive, then everything is frozen.
        $this->patchJson("/api/v1/contact-messages/{$message->id}/archive", [], $auth)
            ->assertOk()->assertJsonPath('data.status', 'archived');
        $this->patchJson("/api/v1/contact-messages/{$message->id}/archive", [], $auth)->assertStatus(422);
        $this->patchJson("/api/v1/contact-messages/{$message->id}/status", ['status' => 'in_progress'], $auth)->assertStatus(422);
    }

    public function test_delete_removes_message_from_listing(): void
    {
        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        $this->deleteJson("/api/v1/contact-messages/{$message->id}", [], $auth)->assertOk();
        $this->assertSoftDeleted('contact_messages', ['id' => $message->id]);
        $this->getJson("/api/v1/contact-messages/{$message->id}", $auth)->assertNotFound();
        $this->assertSame(0, count($this->getJson('/api/v1/contact-messages', $auth)->json('data')));
    }

    public function test_reply_sends_mail_and_stores_history(): void
    {
        Mail::fake();

        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        // Validation errors.
        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", ['subject' => '', 'body_html' => ''], $auth)
            ->assertStatus(422)->assertJsonValidationErrors(['subject', 'body_html']);

        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", [
            'subject' => 'Re: استفسار عن التطوع',
            'body_html' => '<p>شكراً لتواصلكم، سنعود إليكم قريباً.</p>',
        ], $auth)->assertOk();

        Mail::assertSent(ContactMessageReplyMail::class, function (ContactMessageReplyMail $mail) use ($message) {
            return $mail->hasTo($message->email);
        });

        $message->refresh();
        $this->assertNotNull($message->replied_at);
        $this->assertNotNull($message->read_at);
        $this->assertSame('in_progress', $message->status);
        $this->assertSame(1, $message->replies()->count());
        $reply = $message->replies()->first();
        $this->assertSame($this->admin->id, $reply->sender_id);
        $this->assertSame('Re: استفسار عن التطوع', $reply->subject);
    }

    public function test_reply_html_is_sanitized_before_send_and_storage(): void
    {
        Mail::fake();

        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);
        $auth = ['Authorization' => "Bearer {$token}"];

        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", [
            'subject' => 'Re: hello',
            'body_html' => '<p onclick="alert(1)">Hi</p><script>alert(1)</script>'
                .'<iframe src="https://evil.example"></iframe>'
                .'<a href="javascript:alert(1)">bad link</a>'
                .'<a href="https://mujaddidun.org">good link</a>',
        ], $auth)->assertOk();

        $stored = $message->replies()->first()->body_html;
        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringNotContainsString('onclick', $stored);
        $this->assertStringNotContainsString('<iframe', $stored);
        $this->assertStringNotContainsString('javascript:', $stored);
        $this->assertStringContainsString('https://mujaddidun.org', $stored);
        $this->assertStringContainsString('Hi', $stored);

        // A body that sanitizes to nothing is rejected and nothing is sent.
        $before = $message->replies()->count();
        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", [
            'subject' => 'Re: hello',
            'body_html' => '<script>alert(1)</script>',
        ], $auth)->assertStatus(422);
        $this->assertSame($before, $message->replies()->count());
    }

    public function test_reply_mail_failure_returns_error_and_stores_nothing(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $message = $this->makeMessage();
        $token = $this->tokenFor($this->admin);

        $this->postJson("/api/v1/contact-messages/{$message->id}/reply", [
            'subject' => 'Re: hello',
            'body_html' => '<p>hi</p>',
        ], ['Authorization' => "Bearer {$token}"])->assertStatus(502);

        $this->assertSame(0, $message->replies()->count());
        $this->assertNull($message->fresh()->replied_at);
    }
}
