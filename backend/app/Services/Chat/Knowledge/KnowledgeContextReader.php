<?php

namespace App\Services\Chat\Knowledge;

/**
 * Reads the knowledge block back out of an assembled system prompt.
 *
 * The provider contract passes the finished system prompt as a string, which is
 * all a real model ever sees. The development mock needs the same view in
 * structured form so it can answer from retrieved facts instead of canned text.
 *
 * Parsing only — it never adds anything. Whatever comes out was put there by
 * KnowledgeBase, already sanitised.
 */
final class KnowledgeContextReader
{
    /**
     * Source key => snippets, in the order KnowledgeBase emitted them.
     *
     * Returns an empty array when the prompt carries no knowledge block, which
     * is the normal case for a question nothing matched.
     *
     * @return array<string, list<string>>
     */
    public static function parse(string $systemPrompt): array
    {
        if (preg_match('/<knowledge_context>(.*?)<\/knowledge_context>/su', $systemPrompt, $outer) !== 1) {
            return [];
        }

        if (preg_match_all('/\[SOURCE: ([a-z_]+)\]\s*(.*?)\s*\[\/SOURCE\]/su', $outer[1], $blocks, PREG_SET_ORDER) === false) {
            return [];
        }

        $parsed = [];

        foreach ($blocks as $block) {
            $snippets = array_values(array_filter(
                array_map('trim', preg_split('/\n{2,}/u', $block[2]) ?: []),
                static fn (string $snippet): bool => $snippet !== '',
            ));

            if ($snippets !== []) {
                $parsed[$block[1]] = $snippets;
            }
        }

        return $parsed;
    }

    /**
     * The value of one labelled line inside a snippet, e.g. `خبر: …` or
     * `Summary: …`. Returns null when the label is absent.
     *
     * @param  list<string>  $labels  any of these label spellings will match
     */
    public static function line(string $snippet, array $labels): ?string
    {
        foreach (explode("\n", $snippet) as $line) {
            foreach ($labels as $label) {
                if (str_starts_with($line, $label)) {
                    $value = trim(mb_substr($line, mb_strlen($label)));

                    if ($value !== '') {
                        return $value;
                    }
                }
            }
        }

        return null;
    }
}
