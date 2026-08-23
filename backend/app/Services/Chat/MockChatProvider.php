<?php

namespace App\Services\Chat;

use Illuminate\Support\Facades\Log;

/**
 * Development stand-in for the Anthropic provider.
 *
 * Lets the chat UI be built and demonstrated without an API key and without
 * spending anything. It is wired in only by AppServiceProvider, and only when
 * the key is missing *and* the app is running locally — see the binding there
 * for the exact rule. Production never reaches this class.
 *
 * The replies deliberately follow the same rules as the real system prompt:
 * they invent no figures, quote no bank or contact details, and point at the
 * website for specifics. That keeps a screenshot taken during development from
 * showing something the real assistant would never say.
 */
class MockChatProvider implements ChatCompletionProvider
{
    /**
     * Keyword groups, most specific first. The first group with a match wins,
     * so greetings are checked last — "مرحبا، كيف أتبرع؟" should answer the
     * donation question rather than just greeting back.
     */
    private const TOPICS = [
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
            'program', 'programme', 'programs', 'projects', 'project',
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
    ];

    /** @var array<string, array{ar: string, en: string}> */
    private const REPLIES = [
        'volunteering' => [
            'ar' => "يسعدنا اهتمامك بالتطوع مع مجددون! التطوع هو أساس عمل الجمعية، ويشارك متطوعونا في حملات توزيع الطرود الغذائية، وحملة دفء الشتوية، وتجهيز المساعدات وتنظيمها.\n\nيمكنك تقديم طلب التطوع من صفحة \"التطوع\" في الموقع، وسيتواصل معك الفريق لمتابعة طلبك. إذا كان لديك سؤال محدد عن فريق أو محافظة معينة، يمكنك التواصل معنا عبر صفحة الاتصال.",
            'en' => "We're glad you're interested in volunteering with Mujaddidun! Volunteers are at the heart of the association's work — they take part in food parcel distribution, the Warmth (دفء) winter campaign, and preparing and organising aid.\n\nYou can apply through the \"Volunteer\" page on this website, and the team will follow up with you. If you have a question about a specific team or governorate, the contact page is the best place to ask.",
        ],
        'donation' => [
            'ar' => "شكراً لرغبتك في دعم عمل مجددون. تذهب التبرعات إلى برامج الجمعية الثلاثة: نُطعِم لتوفير الغذاء، ونُسكِن لتحسين ظروف السكن، ونُمكِّن لتمكين الأفراد.\n\nتجد طرق التبرع المتاحة وتفاصيلها المحدّثة في صفحة \"تبرع\" على الموقع. لا أستطيع تزويدك بأرقام الحسابات هنا، لذا يُرجى الاعتماد على ما هو منشور في تلك الصفحة أو التواصل معنا مباشرة.",
            'en' => "Thank you for wanting to support Mujaddidun's work. Donations go to the association's three programmes: نُطعِم (feeding), نُسكِن (shelter) and نُمكِّن (empowerment).\n\nThe available donation methods and their current details are on the \"Donate\" page of this website. I can't give out account numbers here, so please rely on what's published there, or contact us directly.",
        ],
        'programs' => [
            'ar' => "تعمل جمعية مجددون من خلال ثلاثة برامج رئيسية:\n\n• نُطعِم — توفير الغذاء وتوزيع الطرود الغذائية على الأسر المحتاجة.\n• نُسكِن — تحسين ظروف السكن للأسر المتعففة.\n• نُمكِّن — تدريب وتمكين الأفراد لبناء مستقبل مستقل.\n\nتجد تفاصيل البرامج والحملات الجارية في صفحتي \"البرامج\" و\"المشاريع\" على الموقع.",
            'en' => "Mujaddidun works through three main programmes:\n\n• نُطعِم (We Feed) — providing food and distributing parcels to families in need.\n• نُسكِن (We Shelter) — improving housing conditions for struggling families.\n• نُمكِّن (We Empower) — training and empowering people to build an independent future.\n\nYou'll find details of current programmes and campaigns on the \"Programs\" and \"Projects\" pages of this website.",
        ],
        'about' => [
            'ar' => "جمعية مجددون الخيرية التنموية هي جمعية أردنية تأسست عام 2009 ومسجلة لدى وزارة التنمية الاجتماعية. يقوم عملها على جهود المتطوعين، وتنظّم أنشطتها ضمن ثلاثة برامج: نُطعِم، ونُسكِن، ونُمكِّن.\n\nيمكنك معرفة المزيد من صفحة \"من نحن\"، ومتابعة أنشطتنا في صفحتي الأخبار ومعرض الصور.",
            'en' => "The Mujaddidun Charity and Development Association is a Jordanian association founded in 2009 and registered with the Ministry of Social Development. Its work is built on volunteer effort and organised under three programmes: نُطعِم (feeding), نُسكِن (shelter) and نُمكِّن (empowerment).\n\nYou can read more on the \"About\" page, and follow our activities through the News and Gallery pages.",
        ],
        'contact' => [
            'ar' => "يسعدنا تواصلك معنا. تجد بيانات التواصل المحدّثة — بما فيها الهاتف والبريد الإلكتروني — في صفحة \"اتصل بنا\" على الموقع، ويمكنك أيضاً إرسال رسالة مباشرة من النموذج الموجود هناك.\n\nلا أستطيع ذكر أرقام الهاتف أو العناوين من الذاكرة، لذا يُرجى الاعتماد على ما هو منشور في تلك الصفحة.",
            'en' => "We'd be glad to hear from you. The current contact details — including phone and email — are on the \"Contact\" page of this website, and you can also send a message straight from the form there.\n\nI can't quote phone numbers or addresses from memory, so please rely on what's published on that page.",
        ],
        'greeting' => [
            'ar' => "مرحباً بك! 👋 أنا مساعد جمعية مجددون الخيرية التنموية.\n\nيمكنني مساعدتك في التعرّف على برامج الجمعية وحملاتها، وكيفية التطوع أو التبرع، إضافة إلى الأخبار والفعاليات ومعلومات التواصل. كيف يمكنني مساعدتك؟",
            'en' => "Hello! 👋 I'm the assistant for the Mujaddidun Charity and Development Association.\n\nI can help you learn about our programmes and campaigns, how to volunteer or donate, as well as news, events and how to get in touch. How can I help?",
        ],
        'fallback' => [
            'ar' => "أعتذر، يمكنني المساعدة فقط في المواضيع المتعلقة بجمعية مجددون وموقعها الإلكتروني.\n\nيسعدني أن أساعدك في التعرّف على برامج الجمعية، أو كيفية التطوع أو التبرع، أو الأخبار والفعاليات، أو طرق التواصل معنا. هل تود السؤال عن أحدها؟",
            'en' => "I'm sorry — I can only help with topics related to the Mujaddidun association and its website.\n\nI'd be happy to help you with our programmes, how to volunteer or donate, news and events, or how to get in touch. Would you like to ask about any of those?",
        ],
    ];

    public function complete(string $systemPrompt, array $messages): string
    {
        $lastUserMessage = '';
        foreach (array_reverse($messages) as $message) {
            if (($message['role'] ?? null) === 'user') {
                $lastUserMessage = (string) ($message['content'] ?? '');
                break;
            }
        }

        $topic = $this->detectTopic($lastUserMessage);
        $language = $this->detectLanguage($lastUserMessage);

        Log::debug('Chat answered by the development mock provider.', [
            'topic' => $topic,
            'language' => $language,
        ]);

        return self::REPLIES[$topic][$language];
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
        // No apostrophes appear in the Latin keyword list, so a plain
        // letters-and-spaces test is enough to tell the two scripts apart.
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
