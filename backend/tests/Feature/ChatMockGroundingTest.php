<?php

namespace Tests\Feature;

use App\Models\Faq;
use App\Models\News;
use App\Models\Program;
use App\Services\Chat\ChatCompletionProvider;
use App\Services\Chat\MockChatProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The development mock answering from the retrieved knowledge context.
 *
 * These run the whole pipeline for real — retrieval, context assembly, prompt
 * construction — with only the network call replaced. Nothing here reaches the
 * Anthropic API.
 */
class ChatMockGroundingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The container picks Anthropic under APP_ENV=testing, so the mock is
        // bound explicitly rather than relying on the environment rule.
        $this->app->instance(ChatCompletionProvider::class, new MockChatProvider());
    }

    private function ask(string $question, string $locale = 'ar'): string
    {
        $response = $this->postJson('/api/v1/public/chat', [
            'messages' => [['role' => 'user', 'content' => $question]],
            'locale' => $locale,
        ])->assertStatus(200)->assertJsonPath('success', true);

        return (string) $response->json('data.reply');
    }

    private function seedPublicContent(): void
    {
        Faq::create([
            'question_ar' => 'كيف يمكنني التطوع مع جمعية مجددون؟',
            'question_en' => 'How can I volunteer with Mujaddidun Association?',
            'answer_ar' => 'يمكنك التقديم للتطوع من خلال نموذج طلبات التطوع على الموقع.',
            'answer_en' => 'You can apply to volunteer through the volunteer application form on the website.',
            'category' => 'general',
            'status' => 'published',
            'sort_order' => 1,
        ]);

        Program::create([
            'title_ar' => 'برنامج محو الأمية الرقمية',
            'title_en' => 'Digital Literacy Program',
            'slug' => 'digital-literacy',
            'summary_ar' => 'دورات مجانية في المهارات الرقمية.',
            'summary_en' => 'Free basic digital-skills courses.',
            'description_ar' => 'برنامج يقدم دورات في المهارات الرقمية.',
            'description_en' => 'A program offering basic digital-skills courses.',
            'category' => 'education',
            'status' => 'active',
        ]);

        $this->publishedArticle();
    }

    private function publishedArticle(): void
    {
        $article = new News();
        $article->forceFill([
            'id' => 8,
            'title_ar' => 'أورنج الأردن تدعم حملات مجددون الخيرية',
            'title_en' => 'Orange Jordan supports Mujaddidun charity campaigns',
            'slug' => 'orange-support',
            'excerpt_ar' => 'رعت أورنج الأردن حملات جمعية مجددون خلال رمضان.',
            'excerpt_en' => 'Orange Jordan sponsored Mujaddidun campaigns during Ramadan.',
            'content_ar' => 'النص الكامل الذي يجب ألا يظهر.',
            'content_en' => 'FULL BODY THAT MUST NOT APPEAR.',
            'author_name' => 'وكالة الأنباء الأردنية (بترا)',
            'status' => 'published',
            'published_at' => '2021-05-17 17:10:28',
        ]);
        $article->save();
    }

    /** Mirrors production: unverified articles are held as drafts. */
    private function draftArticles(): void
    {
        foreach ([
            [1, 'مجددون تطلق حملة الشتاء الدافئ', 'Mujaddidun launches Warm Winter campaign'],
            [2, 'تخريج الدفعة الخامسة', 'Fifth cohort graduates'],
            [3, 'توزيع ٥٠٠٠ طرد غذائي', '5,000 food parcels distributed'],
        ] as [$id, $ar, $en]) {
            $article = new News();
            $article->forceFill([
                'id' => $id,
                'title_ar' => $ar,
                'title_en' => $en,
                'slug' => 'draft-'.$id,
                'excerpt_ar' => 'ملخص غير موثّق.',
                'excerpt_en' => 'Unverified summary.',
                'content_ar' => 'مسودة.',
                'content_en' => 'Draft.',
                'status' => 'draft',
                'published_at' => '2026-08-0'.$id.' 11:38:21',
            ]);
            $article->save();
        }
    }

    // ------------------------------------------------------------- Arabic

    public function test_a_latest_news_question_is_answered_from_published_news(): void
    {
        $this->seedPublicContent();

        foreach (['ما هي آخر الأخبار؟', 'شو آخر الأخبار؟'] as $question) {
            $reply = $this->ask($question);

            $this->assertStringContainsString('أورنج الأردن تدعم حملات مجددون', $reply);
            $this->assertStringContainsString('17 مايو 2021', $reply);
            $this->assertStringContainsString('وكالة الأنباء الأردنية', $reply);
        }
    }

    public function test_a_volunteer_question_is_answered_from_faq_knowledge(): void
    {
        $this->seedPublicContent();

        $reply = $this->ask('كيف يمكنني التطوع؟');

        $this->assertStringContainsString('نموذج طلبات التطوع', $reply);
    }

    public function test_a_program_question_is_answered_from_program_knowledge(): void
    {
        $this->seedPublicContent();

        foreach (['ما هي البرامج؟', 'شو برامج مجددون؟'] as $question) {
            $reply = $this->ask($question);

            $this->assertStringContainsString('برنامج محو الأمية الرقمية', $reply);
        }
    }

    // ------------------------------------------------------------ English

    public function test_english_questions_are_answered_in_english_from_knowledge(): void
    {
        $this->seedPublicContent();

        $news = $this->ask('What are the latest news?', 'en');
        $this->assertStringContainsString('Orange Jordan supports Mujaddidun', $news);
        $this->assertStringContainsString('17 May 2021', $news);
        $this->assertStringNotContainsString('إليك آخر الأخبار', $news);

        $volunteer = $this->ask('How can I volunteer?', 'en');
        $this->assertStringContainsString('volunteer application form', $volunteer);
        $this->assertStringNotContainsString('نموذج طلبات التطوع', $volunteer);

        $programs = $this->ask('What programs does Mujaddidun have?', 'en');
        $this->assertStringContainsString('Digital Literacy Program', $programs);
        $this->assertStringNotContainsString('برنامج محو الأمية', $programs);
    }

    // ------------------------------------------------------------- Safety

    public function test_draft_articles_never_appear_in_a_reply(): void
    {
        $this->seedPublicContent();
        $this->draftArticles();

        foreach ([
            ['ما هي آخر الأخبار؟', 'ar'],
            ['What are the latest news?', 'en'],
            ['حملة الشتاء الدافئ', 'ar'],
            ['Warm Winter campaign', 'en'],
            ['٥٠٠٠ طرد غذائي', 'ar'],
        ] as [$question, $locale]) {
            $reply = $this->ask($question, $locale);

            foreach (['الشتاء الدافئ', 'Warm Winter', 'الدفعة الخامسة', 'Fifth cohort', '٥٠٠٠', '5,000', 'Unverified summary'] as $draftPhrase) {
                $this->assertStringNotContainsString(
                    $draftPhrase,
                    $reply,
                    "draft wording [{$draftPhrase}] surfaced for [{$question}]",
                );
            }
        }
    }

    public function test_no_prompt_internals_are_exposed_to_the_visitor(): void
    {
        $this->seedPublicContent();

        foreach ([
            ['ما هي آخر الأخبار؟', 'ar'],
            ['What programs does Mujaddidun have?', 'en'],
            ['كيف يمكنني التطوع؟', 'ar'],
        ] as [$question, $locale]) {
            $reply = $this->ask($question, $locale);

            foreach ([
                '[SOURCE:', '[/SOURCE]', '<knowledge_context>', '</knowledge_context>',
                'REFERENCE INFORMATION', 'GROUNDING', 'You are the official assistant',
                'FULL BODY THAT MUST NOT APPEAR', 'النص الكامل الذي يجب ألا يظهر',
            ] as $internal) {
                $this->assertStringNotContainsString($internal, $reply, "leaked [{$internal}]");
            }
        }
    }

    public function test_an_unrelated_question_still_gets_the_polite_fallback(): void
    {
        $this->seedPublicContent();

        $english = $this->ask('tell me a joke', 'en');
        $this->assertStringContainsString("I can only help with topics related to the Mujaddidun", $english);

        $arabic = $this->ask('ما هي عاصمة فرنسا؟');
        $this->assertStringContainsString('أعتذر', $arabic);
    }

    public function test_an_on_topic_question_with_no_data_says_so_rather_than_inventing(): void
    {
        // Nothing seeded: the context is empty.
        $arabic = $this->ask('ما هي آخر الأخبار؟');
        $this->assertStringContainsString('لا تتوفر لدي معلومات منشورة', $arabic);

        $english = $this->ask('What programs does Mujaddidun have?', 'en');
        $this->assertStringContainsString("I don't have published information", $english);

        // Crucially, no programme or headline is conjured up.
        $this->assertStringNotContainsString('•', $arabic.$english);
    }

    public function test_donation_details_are_never_invented(): void
    {
        $this->seedPublicContent();

        $reply = $this->ask('كيف أتبرع؟');

        // No FAQ about donating was seeded, so nothing may be asserted about it.
        foreach (['JO00', 'IBAN', 'JIBA', 'SWIFT', 'البنك الإسلامي'] as $financial) {
            $this->assertStringNotContainsString($financial, $reply);
        }
    }

    public function test_a_greeting_is_answered_without_needing_knowledge(): void
    {
        $arabic = $this->ask('مرحباً');
        $this->assertStringContainsString('مساعد جمعية مجددون', $arabic);

        $english = $this->ask('Hello', 'en');
        $this->assertStringContainsString("I'm the assistant", $english);
    }

    public function test_the_response_envelope_is_unchanged(): void
    {
        $this->seedPublicContent();

        $this->postJson('/api/v1/public/chat', [
            'messages' => [['role' => 'user', 'content' => 'ما هي آخر الأخبار؟']],
            'locale' => 'ar',
        ])
            ->assertStatus(200)
            ->assertJsonStructure(['success', 'message', 'data' => ['reply']])
            ->assertJsonPath('success', true);
    }
}
