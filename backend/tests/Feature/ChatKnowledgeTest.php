<?php

namespace Tests\Feature;

use App\Models\Faq;
use App\Models\Program;
use App\Services\Chat\Knowledge\FaqKnowledgeSource;
use App\Services\Chat\Knowledge\KnowledgeBase;
use App\Services\Chat\Knowledge\ProgramKnowledgeSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 2.2 — the two structured knowledge sources.
 *
 * These exercise retrieval directly, with rows created per test, so nothing
 * depends on seed data. No AI provider is involved at this level.
 */
class ChatKnowledgeTest extends TestCase
{
    use RefreshDatabase;

    private function faq(array $overrides = []): Faq
    {
        return Faq::create(array_merge([
            'question_ar' => 'كيف يمكنني التطوع مع جمعية مجددون؟',
            'question_en' => 'How can I volunteer with Mujaddidun Association?',
            'answer_ar' => 'يمكنك التقديم للتطوع من خلال نموذج طلبات التطوع على الموقع.',
            'answer_en' => 'You can apply to volunteer through the volunteer application form on the website.',
            'category' => 'general',
            'status' => 'published',
            'sort_order' => 1,
        ], $overrides));
    }

    private function program(array $overrides = []): Program
    {
        static $n = 0;
        $n++;

        return Program::create(array_merge([
            'title_ar' => 'برنامج محو الأمية الرقمية',
            'title_en' => 'Digital Literacy Program',
            'slug' => 'digital-literacy-'.$n,
            'summary_ar' => 'دورات مجانية في المهارات الرقمية.',
            'summary_en' => 'Free basic digital-skills courses.',
            'description_ar' => 'برنامج يقدم دورات في المهارات الرقمية الأساسية لكبار السن.',
            'description_en' => 'A program offering basic digital-skills courses for seniors.',
            'category' => 'education',
            'status' => 'active',
        ], $overrides));
    }

    // ---------------------------------------------------------------- FAQs

    public function test_an_arabic_question_retrieves_the_matching_faq(): void
    {
        $this->faq();

        $snippets = (new FaqKnowledgeSource())->retrieve('كيف أتطوع معكم؟', 'ar');

        $this->assertNotEmpty($snippets);
        $this->assertStringContainsString('التطوع', $snippets[0]);
        $this->assertStringContainsString('سؤال:', $snippets[0]);
        // Arabic locale must not render the English wording.
        $this->assertStringNotContainsString('How can I volunteer', $snippets[0]);
    }

    public function test_an_english_question_retrieves_the_matching_faq(): void
    {
        $this->faq();

        $snippets = (new FaqKnowledgeSource())->retrieve('How can I volunteer?', 'en');

        $this->assertNotEmpty($snippets);
        $this->assertStringContainsString('volunteer', $snippets[0]);
        $this->assertStringContainsString('Q:', $snippets[0]);
        $this->assertStringNotContainsString('كيف يمكنني التطوع', $snippets[0]);
    }

    public function test_the_most_relevant_faq_is_ranked_first(): void
    {
        // Mentions volunteering only in its answer.
        $this->faq([
            'question_ar' => 'كيف يمكنني دعم مشاريعكم؟',
            'question_en' => 'How can I support your projects?',
            'answer_ar' => 'يمكنك الدعم عبر التبرع أو التطوع.',
            'answer_en' => 'You can help by donating or volunteering.',
            'sort_order' => 0,
        ]);
        // Asks about volunteering directly, but sorts later.
        $this->faq(['sort_order' => 5]);

        $snippets = (new FaqKnowledgeSource())->retrieve('How can I volunteer?', 'en');

        // A hit in the question outweighs a hit in an answer, regardless of order.
        $this->assertStringContainsString('How can I volunteer with', $snippets[0]);
    }

    public function test_an_unrelated_question_retrieves_no_faq(): void
    {
        $this->faq();

        $source = new FaqKnowledgeSource();

        $this->assertSame([], $source->retrieve('ما هي عاصمة فرنسا؟', 'ar'));
        $this->assertSame([], $source->retrieve('Write me a poem about cats', 'en'));
        $this->assertSame([], $source->retrieve('tell me a joke', 'en'));
    }

    public function test_an_empty_faq_dataset_returns_no_knowledge(): void
    {
        $this->assertSame([], (new FaqKnowledgeSource())->retrieve('كيف أتطوع؟', 'ar'));
    }

    public function test_unpublished_faqs_are_never_retrieved(): void
    {
        $this->faq([
            'question_ar' => 'سؤال مسودة عن التطوع',
            'question_en' => 'Draft question about volunteering',
            'answer_ar' => 'إجابة مسودة سرية.',
            'answer_en' => 'Secret draft answer.',
            'status' => 'draft',
        ]);
        $this->faq([
            'question_ar' => 'سؤال مؤرشف عن التطوع',
            'question_en' => 'Archived question about volunteering',
            'answer_ar' => 'إجابة مؤرشفة.',
            'answer_en' => 'Archived answer.',
            'status' => 'archived',
        ]);

        $arabic = implode("\n", (new FaqKnowledgeSource())->retrieve('التطوع', 'ar'));
        $english = implode("\n", (new FaqKnowledgeSource())->retrieve('volunteering', 'en'));

        $this->assertSame('', $arabic);
        $this->assertSame('', $english);
        $this->assertStringNotContainsString('Secret draft answer', $english);
    }

    // ------------------------------------------------------------ Programs

    public function test_an_arabic_question_retrieves_the_matching_program(): void
    {
        $this->program();

        $snippets = (new ProgramKnowledgeSource())->retrieve('ما هو برنامج محو الأمية الرقمية؟', 'ar');

        $this->assertNotEmpty($snippets);
        $this->assertStringContainsString('برنامج محو الأمية الرقمية', $snippets[0]);
        $this->assertStringContainsString('البرنامج:', $snippets[0]);
        $this->assertStringNotContainsString('Digital Literacy Program', $snippets[0]);
    }

    public function test_an_english_question_retrieves_the_matching_program(): void
    {
        $this->program();

        $snippets = (new ProgramKnowledgeSource())->retrieve('Tell me about the Digital Literacy Program', 'en');

        $this->assertNotEmpty($snippets);
        $this->assertStringContainsString('Digital Literacy Program', $snippets[0]);
        $this->assertStringContainsString('Program:', $snippets[0]);
    }

    public function test_a_completed_program_is_labelled_as_completed(): void
    {
        $this->program(['status' => 'completed']);

        $snippets = (new ProgramKnowledgeSource())->retrieve('Digital Literacy Program', 'en');

        // The model must not describe a finished programme as open to join.
        $this->assertStringContainsString('Status: completed', $snippets[0]);
    }

    public function test_an_unrelated_question_retrieves_no_program(): void
    {
        $this->program();

        $source = new ProgramKnowledgeSource();

        $this->assertSame([], $source->retrieve('ما هي عاصمة فرنسا؟', 'ar'));
        $this->assertSame([], $source->retrieve('Write me a poem about cats', 'en'));
    }

    public function test_an_empty_program_dataset_returns_no_knowledge(): void
    {
        $this->assertSame([], (new ProgramKnowledgeSource())->retrieve('برامج', 'ar'));
    }

    public function test_draft_and_archived_programs_are_never_retrieved(): void
    {
        $this->program([
            'title_ar' => 'برنامج مسودة رقمي',
            'title_en' => 'Draft Digital Program',
            'description_ar' => 'محتوى داخلي غير منشور.',
            'description_en' => 'Unpublished internal content.',
            'status' => 'draft',
        ]);
        $this->program([
            'title_ar' => 'برنامج مؤرشف رقمي',
            'title_en' => 'Archived Digital Program',
            'description_ar' => 'محتوى مؤرشف.',
            'description_en' => 'Archived content.',
            'status' => 'archived',
        ]);

        $snippets = (new ProgramKnowledgeSource())->retrieve('Digital Program', 'en');

        $this->assertSame([], $snippets);
        $joined = implode("\n", $snippets);
        $this->assertStringNotContainsString('Unpublished internal content', $joined);
        $this->assertStringNotContainsString('Archived content', $joined);
    }

    public function test_no_internal_fields_leak_into_snippets(): void
    {
        $program = $this->program(['is_featured' => true, 'created_by' => null]);

        $snippet = (new ProgramKnowledgeSource())->retrieve('Digital Literacy Program', 'en')[0];

        foreach (['slug', 'digital-literacy-', 'is_featured', 'created_by', 'cover_image_path'] as $internal) {
            $this->assertStringNotContainsString($internal, $snippet);
        }

        $this->assertStringNotContainsString((string) $program->id, explode("\n", $snippet)[0]);
    }

    // -------------------------------------------------- KnowledgeBase wiring

    public function test_the_registered_knowledge_base_uses_both_public_sources(): void
    {
        $base = $this->app->make(KnowledgeBase::class);

        $this->faq();
        $this->program();

        $context = $base->contextFor('What programs do you have and how do I volunteer?', 'en');

        $this->assertStringContainsString('[faqs]', $context);
        $this->assertStringContainsString('[programs]', $context);
    }

    public function test_the_registered_knowledge_base_returns_nothing_for_unrelated_questions(): void
    {
        $this->faq();
        $this->program();

        $context = $this->app->make(KnowledgeBase::class)->contextFor('Write me a poem about cats', 'en');

        $this->assertSame('', $context);
    }

    public function test_retrieval_is_deterministic(): void
    {
        $this->faq();
        $this->program();

        $base = $this->app->make(KnowledgeBase::class);

        $this->assertSame(
            $base->contextFor('How can I volunteer?', 'en'),
            $base->contextFor('How can I volunteer?', 'en'),
        );
    }
}
