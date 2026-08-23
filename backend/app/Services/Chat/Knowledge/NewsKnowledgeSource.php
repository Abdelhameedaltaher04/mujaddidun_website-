<?php

namespace App\Services\Chat\Knowledge;

use App\Models\News;
use Illuminate\Support\Carbon;

/**
 * Published news articles as chatbot reference material.
 *
 * Visibility mirrors PublicNewsController exactly — `status = 'published'`,
 * newest first. That predicate is the safety boundary and is mirrored rather
 * than reinvented, so anything unpublished is invisible here for the same
 * reason it is invisible on the website.
 *
 * There is deliberately no per-article exclusion list. Articles whose claims
 * are unverified are held as drafts, which keeps one rule ("published means
 * public") instead of two that could drift apart — a new article inherits the
 * protection automatically.
 *
 * Only headline material is exposed: title, excerpt, publication date and
 * author. Full article bodies are excluded; they are by far the largest text
 * in the public corpus and would crowd out every other source inside the
 * KnowledgeBase character budget.
 */
class NewsKnowledgeSource implements KnowledgeSource
{
    /** News is supporting context, not the main answer — keep it tight. */
    private const MAX_RESULTS = 3;

    public function key(): string
    {
        return 'news';
    }

    public function type(): string
    {
        return 'news';
    }

    public function retrieve(string $question, string $locale): array
    {
        $tokens = KeywordMatcher::tokenize($question);

        if ($tokens === []) {
            return [];
        }

        $articles = News::query()
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get();

        $matches = [];

        foreach ($articles as $index => $article) {
            // Matching is limited to what actually gets shown, so a hit can
            // always be seen in the snippet it produced. Titles count double:
            // an article about the thing being asked should outrank one that
            // only brushes past it in a summary.
            $headline = implode(' ', array_filter([
                $article->title_ar, $article->title_en,
            ]));

            $summary = implode(' ', array_filter([
                $article->excerpt_ar, $article->excerpt_en,
            ]));

            $score = (2 * KeywordMatcher::score($tokens, $headline))
                + KeywordMatcher::score($tokens, $summary);

            if ($score > 0) {
                // $index preserves the newest-first ordering when scores tie.
                $matches[] = ['score' => $score, 'order' => $index, 'article' => $article];
            }
        }

        usort(
            $matches,
            static fn (array $a, array $b): int => $b['score'] <=> $a['score'] ?: $a['order'] <=> $b['order'],
        );

        $snippets = [];

        foreach (array_slice($matches, 0, self::MAX_RESULTS) as $match) {
            $snippet = $this->render($match['article'], $locale);

            if ($snippet !== null) {
                $snippets[] = $snippet;
            }
        }

        return $snippets;
    }

    /**
     * One article as plain text in the visitor's language, falling back to the
     * other language when a translation is missing — the same fallback the
     * public site uses, so a headline is never rendered blank.
     */
    private function render(News $article, string $locale): ?string
    {
        $isArabic = $locale !== 'en';

        $title = trim((string) ($isArabic
            ? ($article->title_ar ?: $article->title_en)
            : ($article->title_en ?: $article->title_ar)));

        if ($title === '') {
            return null;
        }

        $lines = [($isArabic ? 'خبر: ' : 'News: ').$title];

        $excerpt = trim((string) ($isArabic
            ? ($article->excerpt_ar ?: $article->excerpt_en)
            : ($article->excerpt_en ?: $article->excerpt_ar)));

        if ($excerpt !== '') {
            $lines[] = ($isArabic ? 'ملخص: ' : 'Summary: ').$excerpt;
        }

        $published = $this->publishedOn($article, $isArabic);

        if ($published !== null) {
            $lines[] = ($isArabic ? 'تاريخ النشر: ' : 'Published: ').$published;
        }

        $author = trim((string) $article->author_name);

        if ($author !== '') {
            // Most published articles are republished from an external agency;
            // naming it lets the assistant attribute rather than assert.
            $lines[] = ($isArabic ? 'المصدر: ' : 'Source: ').$author;
        }

        return implode("\n", $lines);
    }

    /**
     * The publication date, written out rather than as a bare timestamp. Never
     * invented: an article without one simply has no date line.
     */
    private function publishedOn(News $article, bool $isArabic): ?string
    {
        $published = $article->published_at;

        if (! $published instanceof Carbon) {
            return null;
        }

        return $published->locale($isArabic ? 'ar' : 'en')->translatedFormat('j F Y');
    }
}
