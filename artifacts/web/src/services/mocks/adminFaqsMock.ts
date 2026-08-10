import type { PaginatedResponse } from '@/services/adminNews';
import type {
  Faq,
  FaqInput,
  FaqStatus,
  FaqsListParams,
} from '@/services/adminFaqs';

/** In-memory mock database emulating the Laravel FAQ API. */

const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const SEED: Array<
  Pick<Faq, 'question_ar' | 'question_en' | 'answer_ar' | 'answer_en'> & {
    category: Faq['category'];
    status: FaqStatus;
  }
> = [
  {
    question_ar: 'ما هي منصة مجددون؟',
    question_en: 'What is the Mujaddidun platform?',
    answer_ar:
      'منصة مجددون هي منصة مجتمعية غير ربحية تجمع البرامج والفعاليات والمبادرات التطوعية في مكان واحد، وتتيح للأعضاء المشاركة والمساهمة في خدمة المجتمع.',
    answer_en:
      'Mujaddidun is a nonprofit community platform that brings programs, events, and volunteer initiatives together in one place, allowing members to participate and contribute to their community.',
    category: 'general',
    status: 'published',
  },
  {
    question_ar: 'كيف يمكنني الانضمام كعضو؟',
    question_en: 'How can I join as a member?',
    answer_ar:
      'يمكنك التسجيل من خلال صفحة إنشاء الحساب، وبعد تأكيد بريدك الإلكتروني يصبح بإمكانك المشاركة في البرامج والفعاليات.',
    answer_en:
      'You can register through the sign-up page. Once your email is confirmed you can take part in programs and events.',
    category: 'membership',
    status: 'published',
  },
  {
    question_ar: 'هل المشاركة في البرامج مجانية؟',
    question_en: 'Is participating in programs free?',
    answer_ar:
      'معظم البرامج مجانية بالكامل، وبعض البرامج المتخصصة قد تتطلب رسوماً رمزية يتم توضيحها في صفحة البرنامج.',
    answer_en:
      'Most programs are completely free. Some specialized programs may require a small fee, which is clearly stated on the program page.',
    category: 'programs',
    status: 'published',
  },
  {
    question_ar: 'كيف أسجل في فعالية قادمة؟',
    question_en: 'How do I register for an upcoming event?',
    answer_ar:
      'افتح صفحة الفعاليات، واختر الفعالية التي تناسبك، ثم اضغط زر التسجيل واتبع الخطوات.',
    answer_en:
      'Open the events page, choose the event that suits you, then click the registration button and follow the steps.',
    category: 'events',
    status: 'published',
  },
  {
    question_ar: 'هل يمكنني التبرع لدعم المنصة؟',
    question_en: 'Can I donate to support the platform?',
    answer_ar:
      'نعم، نرحب بدعمكم. سيتم توفير بوابة تبرعات إلكترونية قريباً، ويمكنكم حالياً التواصل معنا مباشرة.',
    answer_en:
      'Yes, your support is welcome. An online donation gateway is coming soon; for now you can contact us directly.',
    category: 'donations',
    status: 'draft',
  },
  {
    question_ar: 'كيف يمكنني التطوع في المبادرات؟',
    question_en: 'How can I volunteer in initiatives?',
    answer_ar:
      'بعد تسجيل الدخول يمكنك التقدم للتطوع من صفحة البرنامج أو المبادرة، وسيتواصل معك فريق التنسيق.',
    answer_en:
      'After signing in, you can apply to volunteer from the program or initiative page and the coordination team will contact you.',
    category: 'programs',
    status: 'published',
  },
  {
    question_ar: 'هل تتوفر المنصة باللغة الإنجليزية؟',
    question_en: 'Is the platform available in English?',
    answer_ar:
      'نعم، المنصة متوفرة باللغتين العربية والإنجليزية، ويمكن تبديل اللغة من أعلى الصفحة.',
    answer_en:
      'Yes, the platform is available in both Arabic and English. You can switch the language from the top of the page.',
    category: 'general',
    status: 'published',
  },
  {
    question_ar: 'كيف أحدث بيانات حسابي؟',
    question_en: 'How do I update my account details?',
    answer_ar:
      'من صفحة الملف الشخصي يمكنك تعديل بياناتك الأساسية وتغيير كلمة المرور في أي وقت.',
    answer_en:
      'From your profile page you can edit your basic information and change your password at any time.',
    category: 'membership',
    status: 'draft',
  },
  {
    question_ar: 'هل تصدرون شهادات مشاركة؟',
    question_en: 'Do you issue participation certificates?',
    answer_ar:
      'نعم، تصدر شهادات إلكترونية للمشاركين في البرامج التدريبية بعد استكمال متطلبات البرنامج.',
    answer_en:
      'Yes, electronic certificates are issued to participants in training programs after completing the program requirements.',
    category: 'programs',
    status: 'archived',
  },
  {
    question_ar: 'كيف أتواصل مع فريق المنصة؟',
    question_en: 'How do I contact the platform team?',
    answer_ar:
      'يمكنك استخدام صفحة اتصل بنا أو مراسلتنا عبر البريد الإلكتروني الموضح في أسفل الموقع.',
    answer_en:
      'You can use the contact page or email us at the address shown in the site footer.',
    category: null,
    status: 'published',
  },
  {
    question_ar: 'هل يمكن للمؤسسات الشراكة مع المنصة؟',
    question_en: 'Can organizations partner with the platform?',
    answer_ar:
      'نرحب بالشراكات المؤسسية. تواصلوا معنا عبر صفحة اتصل بنا وسيقوم فريق الشراكات بالرد عليكم.',
    answer_en:
      'We welcome institutional partnerships. Reach out through the contact page and our partnerships team will respond.',
    category: 'general',
    status: 'draft',
  },
  {
    question_ar: 'ما سياسة إلغاء التسجيل في الفعاليات؟',
    question_en: 'What is the event registration cancellation policy?',
    answer_ar:
      'يمكنك إلغاء تسجيلك قبل موعد الفعالية بـ 24 ساعة على الأقل من صفحة الفعالية نفسها.',
    answer_en:
      'You can cancel your registration at least 24 hours before the event from the event page itself.',
    category: 'events',
    status: 'archived',
  },
];

let nextId = 700;

const faqs: Faq[] = SEED.map((seed, index) => {
  const created = new Date(2026, 2 + (index % 5), 2 + index * 2, 9);
  const updated = new Date(created.getTime() + (index % 3) * 86400000);
  return {
    id: ++nextId,
    ...seed,
    display_order: index + 1,
    created_at: created.toISOString(),
    updated_at: updated.toISOString(),
  };
});

function findFaq(id: number): Faq {
  const faq = faqs.find((f) => f.id === id);
  if (!faq) throw new Error('FAQ not found');
  return faq;
}

export const mockFaqsDb = {
  async list(params: FaqsListParams): Promise<PaginatedResponse<Faq>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = faqs.filter((faq) => {
      if (
        search &&
        !faq.question_ar.toLowerCase().includes(search) &&
        !faq.question_en.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (params.category && faq.category !== params.category) return false;
      if (params.status && faq.status !== params.status) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => a.display_order - b.display_order);

    const perPage = params.per_page ?? 10;
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    return {
      data: slice.map((faq) => ({ ...faq })),
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total === 0 ? null : start + 1,
        to: total === 0 ? null : start + slice.length,
      },
    };
  },

  async get(id: number): Promise<Faq> {
    await delay();
    return { ...findFaq(id) };
  },

  async create(input: FaqInput): Promise<Faq> {
    await delay();
    const now = new Date().toISOString();
    const faq: Faq = {
      id: ++nextId,
      ...input,
      created_at: now,
      updated_at: now,
    };
    faqs.push(faq);
    return { ...faq };
  },

  async update(id: number, input: FaqInput): Promise<Faq> {
    await delay();
    const faq = findFaq(id);
    Object.assign(faq, input, { updated_at: new Date().toISOString() });
    return { ...faq };
  },

  async setStatus(id: number, status: FaqStatus): Promise<Faq> {
    await delay();
    const faq = findFaq(id);
    faq.status = status;
    faq.updated_at = new Date().toISOString();
    return { ...faq };
  },

  /** Assigns display_order = index + 1 following the given id order. */
  async reorder(ids: number[]): Promise<Faq[]> {
    await delay();
    const now = new Date().toISOString();
    ids.forEach((id, index) => {
      const faq = faqs.find((f) => f.id === id);
      if (faq) {
        faq.display_order = index + 1;
        faq.updated_at = now;
      }
    });
    return [...faqs]
      .sort((a, b) => a.display_order - b.display_order)
      .map((faq) => ({ ...faq }));
  },

  async remove(id: number): Promise<void> {
    await delay();
    const index = faqs.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('FAQ not found');
    faqs.splice(index, 1);
  },
};
