<?php

namespace App\Services\Chat\Knowledge;

use App\Models\Program;

/**
 * Public programmes as chatbot reference material.
 *
 * Visibility mirrors PublicProgramController exactly — `status IN
 * ('active','completed')` — so drafts and archived programmes never reach the
 * assistant. That predicate is the safety boundary and is deliberately
 * duplicated from the controller rather than re-derived.
 *
 * Only fields the public program resources already expose are used. Notably
 * absent: `created_by`, `is_featured`, `cover_image_path` and `slug`, which are
 * either internal or useless in a text answer.
 */
class ProgramKnowledgeSource implements KnowledgeSource
{
    /** Same statuses PublicProgramController treats as publicly visible. */
    private const PUBLIC_STATUSES = ['active', 'completed'];

    private const MAX_RESULTS = 3;

    /**
     * Words that ask for the programme catalogue as a category.
     *
     * Needed because Arabic forms broken plurals: "برامج" shares no substring
     * with "برنامج", so "ما هي البرامج؟" scores zero against every programme
     * despite being the most obvious question a visitor can ask. When one of
     * these appears, the public programmes are returned in listing order.
     *
     * @var list<string>
     */
    private const LISTING_KEYWORDS = [
        'برامج', 'برنامج', 'مشاريع', 'مشروع', 'مبادرات', 'انشطه',
        'program', 'programme', 'project', 'initiative', 'activities',
    ];

    public function key(): string
    {
        return 'programs';
    }

    public function type(): string
    {
        return 'program';
    }

    public function retrieve(string $question, string $locale): array
    {
        $tokens = KeywordMatcher::tokenize($question);
        $isListingRequest = KeywordMatcher::mentionsAny($question, self::LISTING_KEYWORDS);

        if ($tokens === [] && ! $isListingRequest) {
            return [];
        }

        $programs = Program::query()
            ->whereIn('status', self::PUBLIC_STATUSES)
            // Active before completed, then newest — the same intent as the
            // public listing, without its pagination.
            ->orderByRaw("case when status = 'active' then 0 else 1 end")
            ->orderByDesc('starts_on')
            ->orderBy('id')
            ->get();

        // "What programmes do you have?" — the answer is the catalogue itself,
        // already in listing order from the query above.
        if ($isListingRequest) {
            $snippets = [];

            foreach ($programs->take(self::MAX_RESULTS) as $program) {
                $snippet = $this->render($program, $locale);

                if ($snippet !== null) {
                    $snippets[] = $snippet;
                }
            }

            return $snippets;
        }

        $matches = [];

        foreach ($programs as $index => $program) {
            // Title and summary count double: a programme named after the
            // thing being asked about should outrank one that only mentions it
            // in passing deeper in its description.
            $headline = implode(' ', array_filter([
                $program->title_ar, $program->title_en,
                $program->summary_ar, $program->summary_en,
                $program->category,
            ]));

            $body = implode(' ', array_filter([
                $program->description_ar, $program->description_en,
                $program->objectives_ar, $program->objectives_en,
                $program->requirements_ar, $program->requirements_en,
                $program->target_audience_ar, $program->target_audience_en,
                $program->location_ar, $program->location_en,
            ]));

            $score = (2 * KeywordMatcher::score($tokens, $headline))
                + KeywordMatcher::score($tokens, $body);

            if ($score > 0) {
                $matches[] = ['score' => $score, 'order' => $index, 'program' => $program];
            }
        }

        usort(
            $matches,
            static fn (array $a, array $b): int => $b['score'] <=> $a['score'] ?: $a['order'] <=> $b['order'],
        );

        $snippets = [];

        foreach (array_slice($matches, 0, self::MAX_RESULTS) as $match) {
            $snippet = $this->render($match['program'], $locale);

            if ($snippet !== null) {
                $snippets[] = $snippet;
            }
        }

        return $snippets;
    }

    /**
     * One programme as compact plain text, in the visitor's language with a
     * fallback to the other when a translation is missing.
     */
    private function render(Program $program, string $locale): ?string
    {
        $isArabic = $locale !== 'en';

        $pick = static function (?string $ar, ?string $en) use ($isArabic): string {
            $value = $isArabic ? ($ar ?: $en) : ($en ?: $ar);

            return trim((string) $value);
        };

        $title = $pick($program->title_ar, $program->title_en);

        if ($title === '') {
            return null;
        }

        $lines = [($isArabic ? 'البرنامج: ' : 'Program: ').$title];

        $summary = $pick($program->summary_ar, $program->summary_en);
        if ($summary !== '') {
            $lines[] = ($isArabic ? 'نبذة: ' : 'Summary: ').$summary;
        }

        $description = $pick($program->description_ar, $program->description_en);
        if ($description !== '') {
            $lines[] = ($isArabic ? 'الوصف: ' : 'Description: ').$description;
        }

        $objectives = $pick($program->objectives_ar, $program->objectives_en);
        if ($objectives !== '') {
            $lines[] = ($isArabic ? 'الأهداف: ' : 'Objectives: ').$objectives;
        }

        $requirements = $pick($program->requirements_ar, $program->requirements_en);
        if ($requirements !== '') {
            $lines[] = ($isArabic ? 'المتطلبات: ' : 'Requirements: ').$requirements;
        }

        $audience = $pick($program->target_audience_ar, $program->target_audience_en);
        if ($audience !== '') {
            $lines[] = ($isArabic ? 'الفئة المستهدفة: ' : 'Audience: ').$audience;
        }

        $location = $pick($program->location_ar, $program->location_en);
        if ($location !== '') {
            $lines[] = ($isArabic ? 'المكان: ' : 'Location: ').$location;
        }

        // Status matters: a completed programme must not be described as if it
        // were still open to join.
        $lines[] = ($isArabic ? 'الحالة: ' : 'Status: ').(
            $program->status === 'completed'
                ? ($isArabic ? 'مكتمل' : 'completed')
                : ($isArabic ? 'جارٍ' : 'active')
        );

        return implode("\n", $lines);
    }
}
