<?php

namespace App\Services\Chat\Knowledge;

use App\Models\Faq;

/**
 * Published FAQs as chatbot reference material.
 *
 * The visibility predicate is exactly the one PublicFaqController uses —
 * `status = 'published'`, in admin display order. That predicate *is* the
 * safety boundary, so it is mirrored rather than reinvented: drafts and
 * archived entries never reach the assistant.
 *
 * Only fields the public FAQ resource already exposes are used, and internal
 * ones (id, status, timestamps) are left out because they would add prompt
 * tokens without helping answer anything.
 */
class FaqKnowledgeSource implements KnowledgeSource
{
    /** Enough to answer a question without flooding the prompt. */
    private const MAX_RESULTS = 4;

    public function key(): string
    {
        return 'faqs';
    }

    public function retrieve(string $question, string $locale): array
    {
        $tokens = KeywordMatcher::tokenize($question);

        if ($tokens === []) {
            return [];
        }

        $matches = [];

        // The public list is a handful of short rows, so scoring them in PHP is
        // cheaper and far more predictable than a LIKE query per token.
        $faqs = Faq::query()
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        foreach ($faqs as $index => $faq) {
            // Both languages are scored so an English question can still find
            // an FAQ whose Arabic wording matches, and vice versa.
            //
            // A hit in the FAQ's own question counts double: "how do I
            // volunteer?" should surface the volunteering FAQ ahead of one that
            // merely mentions volunteering somewhere in its answer.
            $asked = implode(' ', array_filter([
                $faq->question_ar, $faq->question_en, $faq->category,
            ]));

            $answered = implode(' ', array_filter([
                $faq->answer_ar, $faq->answer_en,
            ]));

            $score = (2 * KeywordMatcher::score($tokens, $asked))
                + KeywordMatcher::score($tokens, $answered);

            if ($score > 0) {
                // $index keeps the ordering deterministic when scores tie.
                $matches[] = ['score' => $score, 'order' => $index, 'faq' => $faq];
            }
        }

        usort(
            $matches,
            static fn (array $a, array $b): int => $b['score'] <=> $a['score'] ?: $a['order'] <=> $b['order'],
        );

        $snippets = [];

        foreach (array_slice($matches, 0, self::MAX_RESULTS) as $match) {
            $snippet = $this->render($match['faq'], $locale);

            if ($snippet !== null) {
                $snippets[] = $snippet;
            }
        }

        return $snippets;
    }

    /**
     * One FAQ as plain text in the visitor's language, falling back to the other
     * language when a translation is missing — the same fallback the public site
     * uses, so the assistant never shows a blank answer.
     */
    private function render(Faq $faq, string $locale): ?string
    {
        $isArabic = $locale !== 'en';

        $question = $isArabic
            ? ($faq->question_ar ?: $faq->question_en)
            : ($faq->question_en ?: $faq->question_ar);

        $answer = $isArabic
            ? ($faq->answer_ar ?: $faq->answer_en)
            : ($faq->answer_en ?: $faq->answer_ar);

        $question = trim((string) $question);
        $answer = trim((string) $answer);

        if ($question === '' || $answer === '') {
            return null;
        }

        return $isArabic
            ? 'سؤال: '.$question."\n".'إجابة: '.$answer
            : 'Q: '.$question."\n".'A: '.$answer;
    }
}
