<?php

namespace App\Services\Chat\Knowledge;

/**
 * Small deterministic keyword matcher shared by the knowledge sources.
 *
 * The public corpus is a few dozen short bilingual rows, so token overlap is
 * enough to decide relevance — no search engine, index or embedding is
 * warranted at this size. It lives in one place because both sources need the
 * same Arabic normalisation, and two copies of that would drift.
 *
 * Everything here is pure: same input, same output, no state and no I/O.
 */
final class KeywordMatcher
{
    /**
     * Words that appear in almost every question and carry no topical signal.
     * Without this list a question like "كيف حالك؟" would match every FAQ that
     * happens to contain "كيف", and every unrelated question would retrieve
     * something.
     *
     * @var list<string>
     */
    private const STOPWORDS = [
        // Arabic — question words, pronouns, particles, common verbs.
        'ما', 'ماذا', 'من', 'هل', 'كيف', 'اين', 'متى', 'لماذا', 'هي', 'هو', 'هم',
        'في', 'على', 'عن', 'الى', 'مع', 'او', 'ثم', 'التي', 'الذي', 'هذا', 'هذه',
        'ذلك', 'يمكن', 'يمكنني', 'استطيع', 'اريد', 'ارغب', 'لي', 'لك', 'لكم', 'كم',
        'اي', 'كل', 'قد', 'لا', 'نعم', 'يا', 'ان', 'انا', 'انت', 'نحن', 'عند',
        'بعد', 'قبل', 'هناك', 'يوجد', 'شو', 'وين', 'ليش', 'بدي', 'عندكم', 'عندك',
        // English.
        'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
        'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'for', 'from', 'by',
        'and', 'or', 'but', 'with', 'about', 'into', 'over', 'than', 'then',
        'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
        'do', 'does', 'did', 'done', 'have', 'has', 'had',
        'i', 'me', 'my', 'you', 'your', 'we', 'our', 'they', 'them', 'their',
        'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here',
        'please', 'tell', 'want', 'like', 'need', 'get', 'give', 'know', 'any',
        'some', 'all', 'more', 'most', 'if', 'so', 'not', 'no', 'yes',
    ];

    /** Tokens shorter than this carry too little signal to match on. */
    private const MIN_TOKEN_LENGTH = 3;

    /**
     * Normalises text so Arabic spelling variants compare equal.
     *
     * Strips diacritics and tatweel, folds the alef/ya/ta-marbuta variants that
     * Arabic writers use interchangeably, and lowercases Latin text. Without
     * this, "التطوّع" and "التطوع" would be different words.
     */
    public static function normalise(string $text): string
    {
        $text = mb_strtolower($text);

        // Harakat (diacritics), superscript alef, and tatweel.
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $text) ?? $text;

        return strtr($text, [
            'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا',
            'ى' => 'ي', 'ئ' => 'ي',
            'ؤ' => 'و',
            'ة' => 'ه',
        ]);
    }

    /**
     * Significant words in a piece of text, normalised and de-duplicated.
     *
     * Affixes are handled at scoring time rather than here, so the original
     * word is preserved for the stopword check.
     *
     * @return list<string>
     */
    public static function tokenize(string $text): array
    {
        $parts = preg_split('/[^\p{L}\p{N}]+/u', self::normalise($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $tokens = [];

        foreach ($parts as $part) {
            if (mb_strlen($part) < self::MIN_TOKEN_LENGTH) {
                continue;
            }

            if (in_array($part, self::STOPWORDS, true)) {
                continue;
            }

            $tokens[$part] = true;
        }

        return array_keys($tokens);
    }

    /**
     * How many distinct question tokens appear in the haystack.
     *
     * Each token is expanded into a few affix-stripped forms before matching.
     * Arabic attaches articles, particles and verb prefixes directly to the
     * stem, so a visitor asking "كيف أتطوع؟" must still reach an answer written
     * as "التطوع" — neither string contains the other, but both contain the
     * stem "تطوع". English gets the same treatment for common suffixes, so
     * "volunteering" matches "volunteer".
     *
     * @param  list<string>  $tokens  already produced by tokenize()
     */
    public static function score(array $tokens, string $haystack): int
    {
        if ($tokens === []) {
            return 0;
        }

        $haystack = self::normalise($haystack);
        $score = 0;

        foreach ($tokens as $token) {
            foreach (self::variants($token) as $variant) {
                if (self::variantAppearsIn($variant, $haystack)) {
                    $score++;
                    break; // one hit per token, however many forms matched
                }
            }
        }

        return $score;
    }

    /**
     * Whether one surface form occurs in already-normalised text.
     *
     * Latin forms must start at a word boundary, or short stems match inside
     * unrelated words — "cat" would otherwise be found in "appli-cat-ion" and
     * an unrelated question would retrieve an FAQ. There is no trailing
     * boundary, so the stem "program" still matches "programs".
     *
     * Arabic uses plain substring matching on purpose: articles, particles and
     * pronouns attach directly to the stem, so "تطوع" must be findable inside
     * "التطوع" and "للتطوع".
     */
    private static function variantAppearsIn(string $variant, string $haystack): bool
    {
        if (preg_match('/^[a-z0-9]+$/', $variant) === 1) {
            return preg_match('/\b'.preg_quote($variant, '/').'/u', $haystack) === 1;
        }

        return mb_strpos($haystack, $variant) !== false;
    }

    /**
     * Plausible surface forms of a token: the word itself plus a small set of
     * affix-stripped stems.
     *
     * Deliberately conservative — only prefixes that are genuinely grammatical
     * in Arabic (the definite article, the imperfect-verb prefixes, and the
     * particles و/ب/ل/ف/ك) and the most common English suffixes. Stripping more
     * would start matching unrelated words.
     *
     * @return list<string>
     */
    private static function variants(string $token): array
    {
        $forms = [$token => true];

        $addArabicStems = static function (string $word) use (&$forms): void {
            if (str_starts_with($word, 'ال') && mb_strlen($word) > 4) {
                $forms[mb_substr($word, 2)] = true;
            }
        };

        $addArabicStems($token);

        $first = mb_substr($token, 0, 1);

        if (in_array($first, ['ا', 'ي', 'ت', 'ن', 'و', 'ب', 'ل', 'ف', 'ك'], true) && mb_strlen($token) >= 4) {
            $rest = mb_substr($token, 1);
            $forms[$rest] = true;
            $addArabicStems($rest);
        }

        foreach (['ing', 'ies', 'es', 'ed', 's'] as $suffix) {
            if (str_ends_with($token, $suffix) && mb_strlen($token) - mb_strlen($suffix) >= self::MIN_TOKEN_LENGTH) {
                $forms[mb_substr($token, 0, mb_strlen($token) - mb_strlen($suffix))] = true;
                break;
            }
        }

        return array_keys(array_filter(
            $forms,
            static fn (bool $keep, string $form): bool => mb_strlen($form) >= self::MIN_TOKEN_LENGTH,
            ARRAY_FILTER_USE_BOTH,
        ));
    }
}
