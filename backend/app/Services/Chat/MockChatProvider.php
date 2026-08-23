<?php

namespace App\Services\Chat;

use App\Services\Chat\Knowledge\KeywordMatcher;
use App\Services\Chat\Knowledge\KnowledgeContextReader;
use Illuminate\Support\Facades\Log;

/**
 * Development stand-in for the Anthropic provider.
 *
 * Lets the chat UI be built and demonstrated without an API key and without
 * spending anything. It is wired in only by AppServiceProvider, and only when
 * the key is missing *and* the app is running locally — see the binding there
 * for the exact rule. Production never reaches this class.
 *
 * It answers the way the real assistant is instructed to: from the knowledge
 * block in the system prompt when one is present, and with a plain "I don't
 * have that" when it is not. Nothing here invents a programme, an article, a
 * date, a phone number or a bank detail — every fact in a grounded reply is
 * copied out of the retrieved context, so what a developer sees locally
 * reflects what retrieval actually produced.
 */
class MockChatProvider implements ChatCompletionProvider
{
    /**
     * Keyword groups, most specific first. The first group with a match wins,
     * so greetings are checked last — "مرحبا، كيف أتبرع؟" should answer the
     * donation question rather than just greeting back.
     */
    private const TOPICS = [
        'news' => [
            'اخبار', 'الاخبار', 'أخبار', 'الأخبار', 'خبر', 'مستجدات', 'جديد',
            'news', 'latest', 'update', 'headline',
        ],
        'events' => [
            'فعالية', 'فعاليات', 'الفعاليات', 'نشاط', 'أنشطة', 'ورشة',
            'event', 'events', 'workshop', 'activities',
        ],
        'volunteering' => [
            'تطوع', 'متطوع', 'التطوع', 'أتطوع', 'انضم',
            'volunteer', 'volunteering', 'join',
        ],
        'donation' => [
            'تبرع', 'التبرع', 'أتبرع', 'تبرعات', 'دعم مالي',
            'donate', 'donation', 'donating', 'contribute',
        ],
        'programs' => [
            'برنامج', 'برامج', 'مشاريع', 'مشروع', 'نطعم', 'نسكن', 'نمكن',
            // Each plural is spelled out because Latin keywords are matched
            // between word boundaries, so "program" does not match "programs".
            // Both spellings are listed: a visitor writing British English was
            // being told their question was off topic.
            'program', 'programs', 'programme', 'programmes', 'project', 'projects',
        ],
        'about' => [
            'مجددون', 'الجمعية', 'من أنتم', 'عنكم', 'تعريف',
            // No bare 'about': it matches ordinary sentences such as
            // "write me a poem about cats", which must reach the fallback.
            'mujaddidun', 'association', 'charity',
            'who are you', 'about you', 'about the association',
        ],
        'contact' => [
            'تواصل', 'اتصال', 'عنوان', 'هاتف', 'ايميل', 'بريد',
            'contact', 'phone', 'email', 'address', 'reach you',
        ],
        'greeting' => [
            'مرحبا', 'مرحباً', 'السلام', 'أهلا', 'أهلاً', 'هلا', 'صباح', 'مساء',
            'hello', 'hi', 'hey', 'good morning', 'good evening', 'salam',
        ],
        // Checked last, after every subject and after greeting: "thanks, how do
        // I donate?" must answer the donation question, not just say you're
        // welcome. Only a message with nothing else in it lands here.
        //
        // "شكر" is the stem on purpose — it covers شكراً, شكرًا, أشكرك and
        // الشكر, whose tanween sits on either side of the alef and so defeats a
        // literal "شكرا".
        'acknowledgement' => [
            'شكر', 'مشكور', 'يعطيك العافية', 'تسلم', 'جزاك', 'تمام', 'ممتاز', 'رائع',
            'thanks', 'thank you', 'thx', 'great', 'perfect', 'appreciate it', 'got it',
        ],
    ];

    /**
     * Topics answered from wording alone, with no knowledge context.
     *
     * Both are about the exchange rather than about the association, so neither
     * needs a fact and neither may be answered with "I don't have published
     * information" — that would be a non-sequitur in reply to "thank you".
     *
     * @var list<string>
     */
    private const CONVERSATIONAL_TOPICS = ['greeting', 'acknowledgement'];

    /**
     * Which knowledge source answers which topic, in order of preference.
     *
     * @var array<string, list<string>>
     */
    private const TOPIC_SOURCES = [
        'news' => ['news'],
        // Events are in scope but have no knowledge source: the audit found
        // every event record to be placeholder, so none is exposed. Routing to
        // the FAQs lets a published answer ("see the Events page") stand in,
        // and when there is none the reply is "I don't have that" rather than
        // the off-topic apology, which would wrongly tell a visitor their
        // question was irrelevant.
        'events' => ['faqs'],
        'programs' => ['programs', 'faqs'],
        'volunteering' => ['faqs', 'programs'],
        'donation' => ['faqs'],
        'about' => ['faqs', 'programs'],
        'contact' => ['faqs'],
    ];

    /**
     * Only connective wording lives here — leads, and the two replies used when
     * there is nothing to ground on. No fact about the association appears in
     * this list; facts come exclusively from the knowledge context.
     *
     * @var array<string, array{ar: string, en: string}>
     */
    private const PHRASES = [
        'news_lead' => [
            'ar' => 'إليك آخر الأخبار المنشورة على موقع مجددون:',
            'en' => 'Here is the latest news published on the Mujaddidun website:',
        ],
        'programs_lead' => [
            'ar' => 'هذه البرامج المتاحة حالياً:',
            'en' => 'These are the programmes currently listed:',
        ],
        'general_lead' => [
            'ar' => 'إليك ما هو منشور لدينا حول ذلك:',
            'en' => 'Here is what we have published about that:',
        ],
        'more_on_site' => [
            'ar' => 'تجد التفاصيل الكاملة في الصفحات المخصصة على الموقع.',
            'en' => 'You can find the full details on the relevant pages of the website.',
        ],
        'greeting' => [
            'ar' => "مرحباً بك! 👋 أنا مساعد جمعية مجددون الخيرية التنموية.\n\nيمكنني مساعدتك في التعرّف على برامج الجمعية وحملاتها، وكيفية التطوع أو التبرع، إضافة إلى الأخبار ومعلومات التواصل. كيف يمكنني مساعدتك؟",
            'en' => "Hello! 👋 I'm the assistant for the Mujaddidun Charity and Development Association.\n\nI can help you learn about our programmes and campaigns, how to volunteer or donate, as well as news and how to get in touch. How can I help?",
        ],
        'acknowledgement' => [
            'ar' => "على الرحب والسعة! 🌿

إن كان لديك سؤال آخر عن الجمعية أو برامجها، فأنا هنا.",
            'en' => "You're very welcome! 🌿

If you have another question about the association or its programmes, I'm here.",
        ],
        'not_available' => [
            'ar' => "لا تتوفر لدي معلومات منشورة حول هذا الأمر.\n\nيمكنك مراجعة الصفحات المخصصة على الموقع أو التواصل معنا مباشرة عبر صفحة اتصل بنا.",
            'en' => "I don't have published information about that.\n\nYou can check the relevant pages of the website, or contact us directly through the Contact page.",
        ],
        'fallback' => [
            'ar' => "أعتذر، يمكنني المساعدة فقط في المواضيع المتعلقة بجمعية مجددون وموقعها الإلكتروني.\n\nيسعدني أن أساعدك في التعرّف على برامج الجمعية، أو كيفية التطوع أو التبرع، أو الأخبار، أو طرق التواصل معنا. هل تود السؤال عن أحدها؟",
            'en' => "I'm sorry — I can only help with topics related to the Mujaddidun association and its website.\n\nI'd be happy to help you with our programmes, how to volunteer or donate, news, or how to get in touch. Would you like to ask about any of those?",
        ],
    ];

    /**
     * User turns the mock may consider, matching ChatService::CARRY_OVER_TURNS
     * plus the latest message. The two must agree: a topic detected from a turn
     * outside the retrieval window would have no context to answer from.
     */
    private const CARRY_OVER_WINDOW = 3;

    public function complete(string $systemPrompt, array $messages): string
    {
        $turns = $this->recentUserMessages($messages);
        $lastUserMessage = $turns[0] ?? '';

        // Language follows the newest turn only: a visitor who switches to
        // English mid-conversation should be answered in English.
        $topic = $this->detectConversationTopic($turns);
        $language = $this->detectLanguage($lastUserMessage);
        $knowledge = KnowledgeContextReader::parse($systemPrompt);

        $reply = in_array($topic, self::CONVERSATIONAL_TOPICS, true)
            ? self::PHRASES[$topic][$language]
            : $this->groundedAnswer($topic, $knowledge, $language);

        if ($reply === null) {
            // On topic but nothing retrieved, versus plainly off topic — the
            // real assistant is instructed to distinguish these, so the mock
            // does too rather than blaming the visitor for a gap in our data.
            $reply = $topic === 'fallback'
                ? self::PHRASES['fallback'][$language]
                : self::PHRASES['not_available'][$language];
        }

        Log::debug('Chat answered by the development mock provider.', [
            'topic' => $topic,
            'language' => $language,
            'grounded_sources' => array_keys($knowledge),
        ]);

        return $reply;
    }

    /**
     * The topic under discussion, looking back when the newest turn has none.
     *
     * A follow-up names no topic: "وكم مدته؟" and "and the second one?" are
     * about whatever was just asked. Without this the mock would reach the
     * off-topic apology and tell a visitor that their question about our own
     * programme was irrelevant — which is precisely the failure this mirrors
     * ChatService in fixing.
     *
     * Greetings and acknowledgements never carry over: "مرحبا" and "شكراً" are
     * about the turn they appear in, so a later question must not be answered
     * by greeting or thanking the visitor again.
     *
     * Known limit of the mock: it cannot tell an elliptical follow-up from a
     * genuinely off-topic aside, so "tell me a joke" asked after a programme
     * question inherits that topic instead of reaching the apology. The real
     * provider is a model reading the same instructions and does not share this
     * limitation; the single-turn behaviour it would regress is covered by
     * test_an_unrelated_question_still_gets_the_polite_fallback.
     *
     * @param  list<string>  $turns  newest first
     */
    private function detectConversationTopic(array $turns): string
    {
        foreach ($turns as $index => $turn) {
            $topic = $this->detectTopic($turn);

            if ($topic === 'fallback') {
                // Only an elliptical follow-up may borrow an earlier subject.
                // A fresh question that matched no topic is off topic, and
                // saying so is the correct answer — inheriting the previous
                // subject would answer something nobody asked.
                if (! KeywordMatcher::continuesPreviousTurn($turn)) {
                    return 'fallback';
                }

                continue;
            }

            if ($index > 0 && in_array($topic, self::CONVERSATIONAL_TOPICS, true)) {
                continue;
            }

            return $topic;
        }

        return 'fallback';
    }

    /**
     * The visitor's user turns, newest first, capped to match the retrieval
     * window ChatService uses so the mock never claims a topic for which no
     * context could have been retrieved.
     *
     * @param  list<array{role: string, content: string}>  $messages
     * @return list<string>
     */
    private function recentUserMessages(array $messages): array
    {
        $turns = [];

        foreach (array_reverse($messages) as $message) {
            if (($message['role'] ?? null) !== 'user') {
                continue;
            }

            $content = trim((string) ($message['content'] ?? ''));

            if ($content === '') {
                continue;
            }

            $turns[] = $content;

            if (count($turns) >= self::CARRY_OVER_WINDOW) {
                break;
            }
        }

        return $turns;
    }

    /**
     * Builds an answer purely from retrieved snippets, or null when the context
     * holds nothing usable for this topic.
     *
     * @param  array<string, list<string>>  $knowledge
     */
    private function groundedAnswer(string $topic, array $knowledge, string $language): ?string
    {
        foreach (self::TOPIC_SOURCES[$topic] ?? [] as $sourceKey) {
            $snippets = $knowledge[$sourceKey] ?? [];

            if ($snippets === []) {
                continue;
            }

            $body = match ($sourceKey) {
                'news' => $this->renderNews($snippets),
                'programs' => $this->renderPrograms($snippets),
                default => $this->renderFaqs($snippets),
            };

            if ($body === null) {
                continue;
            }

            $lead = match ($sourceKey) {
                'news' => self::PHRASES['news_lead'][$language],
                'programs' => self::PHRASES['programs_lead'][$language],
                default => self::PHRASES['general_lead'][$language],
            };

            return $lead."\n\n".$body."\n\n".self::PHRASES['more_on_site'][$language];
        }

        return null;
    }

    /** @param list<string> $snippets */
    private function renderNews(array $snippets): ?string
    {
        $lines = [];

        foreach ($snippets as $snippet) {
            $title = KnowledgeContextReader::line($snippet, ['خبر:', 'News:']);

            if ($title === null) {
                continue;
            }

            $meta = array_values(array_filter([
                KnowledgeContextReader::line($snippet, ['تاريخ النشر:', 'Published:']),
                KnowledgeContextReader::line($snippet, ['المصدر:', 'Source:']),
            ]));

            $lines[] = '• '.$title.($meta === [] ? '' : ' — '.implode(' · ', $meta));
        }

        return $lines === [] ? null : implode("\n", $lines);
    }

    /** @param list<string> $snippets */
    private function renderPrograms(array $snippets): ?string
    {
        $lines = [];

        foreach ($snippets as $snippet) {
            $title = KnowledgeContextReader::line($snippet, ['البرنامج:', 'Program:']);

            if ($title === null) {
                continue;
            }

            $summary = KnowledgeContextReader::line($snippet, ['نبذة:', 'Summary:'])
                ?? KnowledgeContextReader::line($snippet, ['الوصف:', 'Description:']);

            $lines[] = '• '.$title.($summary === null ? '' : ' — '.$summary);
        }

        return $lines === [] ? null : implode("\n", $lines);
    }

    /**
     * FAQ answers already read as prose, so the best-ranked one is used as the
     * reply body directly.
     *
     * @param  list<string>  $snippets
     */
    private function renderFaqs(array $snippets): ?string
    {
        foreach ($snippets as $snippet) {
            $answer = KnowledgeContextReader::line($snippet, ['إجابة:', 'A:']);

            if ($answer !== null) {
                return $answer;
            }
        }

        return null;
    }

    private function detectTopic(string $message): string
    {
        $haystack = mb_strtolower(trim($message));

        if ($haystack === '') {
            return 'fallback';
        }

        foreach (self::TOPICS as $topic => $keywords) {
            foreach ($keywords as $keyword) {
                if ($this->matches($haystack, $keyword)) {
                    return $topic;
                }
            }
        }

        return 'fallback';
    }

    /**
     * Latin keywords are matched on word boundaries so short ones ("hi",
     * "join") cannot fire inside an unrelated word ("this", "joint"). Arabic
     * keywords stay substring matches on purpose: prefixes such as the
     * definite article mean "التطوع" should still match the stem "تطوع".
     */
    private function matches(string $haystack, string $keyword): bool
    {
        if (preg_match('/^[a-z ]+$/', $keyword) === 1) {
            return preg_match('/\b'.preg_quote($keyword, '/').'\b/u', $haystack) === 1;
        }

        return mb_strpos($haystack, $keyword) !== false;
    }

    /** Any Arabic letter in the message means the visitor is writing Arabic. */
    private function detectLanguage(string $message): string
    {
        return preg_match('/\p{Arabic}/u', $message) === 1 ? 'ar' : 'en';
    }
}
