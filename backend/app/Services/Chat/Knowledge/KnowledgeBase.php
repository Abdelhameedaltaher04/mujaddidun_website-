<?php

namespace App\Services\Chat\Knowledge;

/**
 * Builds the grounded reference context for one question.
 *
 * Collects snippets from every registered source, sanitises them, groups them
 * into labelled `[SOURCE: …]` blocks and caps the whole thing at a fixed size.
 * ChatService inserts the result into the system prompt, wraps it in
 * `<knowledge_context>` and states the rules for treating it as data.
 *
 * Deterministic and side-effect free: the same question, locale and set of
 * sources always produce the same string, byte for byte. Nothing is written,
 * cached or logged here.
 *
 * Line breaks are hard-coded rather than PHP_EOL on purpose: this output
 * becomes part of the prompt, and PHP_EOL emits CRLF on Windows and LF on
 * Linux. That would make identical content produce different prompt bytes per
 * platform, breaking determinism and provider prompt-cache hits.
 */
class KnowledgeBase
{
    /**
     * Ceiling on the assembled context, in characters.
     *
     * The whole public FAQ + programme corpus is a few thousand characters
     * today, so this is headroom rather than a squeeze — its job is to stop a
     * grown database from silently ballooning every prompt. Roughly 3k tokens
     * of Arabic-heavy text.
     */
    public const DEFAULT_MAX_CHARACTERS = 6000;

    /**
     * Source categories in the order they should appear.
     *
     * Direct question-and-answer material comes first, then catalogue-style
     * material, then time-bound reporting: an assistant answering "how do I
     * volunteer?" reads the FAQ before a programme listing, and a news item
     * last. Anything not listed sorts after those, and ties fall back to
     * registration order — no intent classifier involved.
     */
    private const TYPE_PRIORITY = ['faq' => 0, 'program' => 1, 'news' => 2];

    /** @var list<KnowledgeSource> */
    private array $sources;

    /**
     * @param  iterable<KnowledgeSource>  $sources
     * @param  int|null  $maxCharacters  overrides the default ceiling
     */
    public function __construct(iterable $sources = [], private readonly ?int $maxCharacters = null)
    {
        $this->sources = array_values(
            array_filter(
                is_array($sources) ? $sources : iterator_to_array($sources),
                static fn (mixed $source): bool => $source instanceof KnowledgeSource,
            ),
        );
    }

    /** True when there is nothing that could contribute knowledge. */
    public function isEmpty(): bool
    {
        return $this->sources === [];
    }

    public function maxCharacters(): int
    {
        return $this->maxCharacters ?? self::DEFAULT_MAX_CHARACTERS;
    }

    /**
     * Assembles the reference context, or an empty string when no source has
     * anything relevant — in which case ChatService adds no block at all and
     * the assistant follows its standing rule to say it does not know.
     *
     * @param  string  $question  the visitor's latest message, untrusted input
     * @param  string  $locale    'ar' or 'en'
     */
    public function contextFor(string $question, string $locale = 'ar'): string
    {
        if ($this->sources === []) {
            return '';
        }

        $collected = [];

        foreach ($this->sources as $index => $source) {
            $snippets = [];

            foreach ($source->retrieve($question, $locale) as $snippet) {
                if (! is_string($snippet)) {
                    continue;
                }

                $snippet = trim($snippet);

                if ($snippet !== '') {
                    $snippets[] = $this->sanitise($snippet);
                }
            }

            if ($snippets === []) {
                continue;
            }

            $collected[] = [
                'key' => $source->key(),
                'priority' => self::TYPE_PRIORITY[$source->type()] ?? PHP_INT_MAX,
                'order' => $index,
                'snippets' => $snippets,
            ];
        }

        if ($collected === []) {
            return '';
        }

        usort(
            $collected,
            static fn (array $a, array $b): int => $a['priority'] <=> $b['priority'] ?: $a['order'] <=> $b['order'],
        );

        return $this->render($collected);
    }

    /**
     * Renders the sorted sources into blocks, stopping once the budget is spent.
     *
     * Trimming happens at snippet boundaries only: a snippet is either included
     * whole or left out entirely, so the model never reads a fact that stops
     * mid-sentence. Sources are already sorted by priority and their snippets by
     * relevance, so whatever gets dropped is always the least important material.
     *
     * @param  list<array{key: string, priority: int, order: int, snippets: list<string>}>  $collected
     */
    private function render(array $collected): string
    {
        $budget = $this->maxCharacters();
        $blocks = [];

        foreach ($collected as $source) {
            $open = '[SOURCE: '.$source['key'].']';
            $close = '[/SOURCE]';
            // Wrapper cost: both markers, their two newlines, and the blank
            // line separating this block from the previous one.
            $overhead = mb_strlen($open) + mb_strlen($close) + ($blocks === [] ? 2 : 4);

            if ($budget - $overhead <= 0) {
                break;
            }

            $budget -= $overhead;
            $kept = [];

            foreach ($source['snippets'] as $snippet) {
                $cost = mb_strlen($snippet) + ($kept === [] ? 0 : 2);

                if ($cost > $budget) {
                    // Whole snippets only — never a truncated fact.
                    break;
                }

                $budget -= $cost;
                $kept[] = $snippet;
            }

            if ($kept === []) {
                // Nothing fitted; hand the wrapper budget back and skip the block.
                $budget += $overhead;

                continue;
            }

            $blocks[] = $open."\n".implode("\n\n", $kept)."\n".$close;
        }

        return implode("\n\n", $blocks);
    }

    /**
     * Neutralises anything in retrieved content that could be mistaken for
     * structure or for a conversation turn.
     *
     * Content comes from the database, so it is only as trustworthy as whoever
     * can edit it — a compromised admin account is the realistic threat. Two
     * classes of payload are defused:
     *
     *  - block markers (`[SOURCE: …]`, `[/SOURCE]`, `<knowledge_context>`),
     *    which could otherwise close the block early and have the remaining
     *    text read as prompt rather than as data;
     *  - line-leading role markers (`SYSTEM:`, `user:`, `assistant:`), which
     *    imitate a turn boundary.
     *
     * Role markers are defused only at the start of a line, which is the shape
     * an injection takes. An ordinary sentence containing "user:" mid-line stays
     * readable.
     */
    private function sanitise(string $snippet): string
    {
        $snippet = str_replace(
            ['<knowledge_context>', '</knowledge_context>', '[SOURCE:', '[/SOURCE]'],
            ['&lt;knowledge_context&gt;', '&lt;/knowledge_context&gt;', '(SOURCE:', '(/SOURCE)'],
            $snippet,
        );

        return preg_replace(
            '/^([ \t]*)(system|user|assistant|human|ai)([ \t]*):/imu',
            '$1$2$3[:]',
            $snippet,
        ) ?? $snippet;
    }
}
