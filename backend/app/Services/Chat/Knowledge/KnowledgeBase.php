<?php

namespace App\Services\Chat\Knowledge;

/**
 * Collects public knowledge for one question from every registered source.
 *
 * Deterministic and side-effect free: the same question, locale and set of
 * sources always produce the same string, and nothing is written, cached or
 * logged here. Caching belongs to a later phase and to the sources themselves.
 *
 * Phase 2.1 registers no sources, so this always returns an empty string and
 * the assistant behaves exactly as it did in Phase 1.
 *
 * Line breaks are hard-coded rather than PHP_EOL on purpose: this output
 * becomes part of the prompt, and PHP_EOL emits CRLF on Windows and LF on
 * Linux. That would make identical content produce different prompt bytes per
 * platform, breaking determinism and provider prompt-cache hits.
 */
class KnowledgeBase
{
    /** @var list<KnowledgeSource> */
    private array $sources;

    /**
     * @param  iterable<KnowledgeSource>  $sources
     */
    public function __construct(iterable $sources = [])
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

    /**
     * Assembles the reference text for a question, or an empty string when no
     * source has anything relevant.
     *
     * Sources are consulted in registration order, and each source's snippets
     * are labelled with its key so the origin of a fact stays visible.
     *
     * @param  string  $question  the visitor's latest message, untrusted input
     * @param  string  $locale    'ar' or 'en'
     */
    public function contextFor(string $question, string $locale = 'ar'): string
    {
        if ($this->sources === []) {
            return '';
        }

        $blocks = [];

        foreach ($this->sources as $source) {
            $snippets = [];

            foreach ($source->retrieve($question, $locale) as $snippet) {
                if (! is_string($snippet)) {
                    continue;
                }

                $snippet = trim($snippet);

                if ($snippet !== '') {
                    $snippets[] = $snippet;
                }
            }

            if ($snippets === []) {
                continue;
            }

            $blocks[] = '['.$source->key().']'."\n".implode("\n", $snippets);
        }

        return implode("\n\n", $blocks);
    }
}
