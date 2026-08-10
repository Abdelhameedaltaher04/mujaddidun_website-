import type { PaginatedResponse } from '@/services/adminNews';
import { canTransition } from '@/services/adminVolunteers';
import type {
  ApplicationDocument,
  ApplicationNote,
  ApplicationStatistics,
  ApplicationStatus,
  ApplicationsListParams,
  StatusChangeInput,
  VolunteerApplication,
  VolunteerProgram,
} from '@/services/adminVolunteers';

/**
 * In-memory mock database emulating the Laravel Volunteer Applications API.
 * All applicants, notes, and document links below are fictional sample data;
 * real private notes/documents will only ever come from the authorized
 * Laravel endpoints and must never be bundled client-side.
 */

const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const PROGRAMS: VolunteerProgram[] = [
  { id: 11, title_ar: 'تمكين الشباب', title_en: 'Youth Empowerment' },
  { id: 12, title_ar: 'محو الأمية الرقمية', title_en: 'Digital Literacy' },
  { id: 13, title_ar: 'الرعاية الصحية المجتمعية', title_en: 'Community Health' },
  { id: 14, title_ar: 'التوعية البيئية', title_en: 'Environmental Awareness' },
];

interface Seed {
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  date_of_birth: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  preferred_area: string | null;
  programIndex: number | null;
  availability: string | null;
  motivation: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  hasAvatar: boolean;
}

const SEED: Seed[] = [
  {
    full_name: 'سلمى الأنصاري',
    email: 'salma.ansari@example.com',
    phone: '+966501112223',
    country: 'السعودية',
    date_of_birth: '1998-04-12',
    skills: ['التدريب', 'إدارة الفعاليات', 'التواصل'],
    experience: 'ثلاث سنوات في تنظيم الفعاليات التطوعية الجامعية وقيادة فرق طلابية.',
    education: 'بكالوريوس إدارة أعمال — جامعة الملك سعود',
    preferred_area: 'تنظيم الفعاليات',
    programIndex: 0,
    availability: 'عطلات نهاية الأسبوع',
    motivation: 'أرغب في تطوير مهاراتي القيادية والمساهمة في تمكين جيل الشباب في مجتمعي.',
    status: 'pending',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'Karim Mansour',
    email: 'karim.mansour@example.com',
    phone: '+971502223344',
    country: 'الإمارات',
    date_of_birth: '1995-09-30',
    skills: ['Web Development', 'Teaching', 'Arabic-English Translation'],
    experience: 'Volunteer coding instructor for two years at a community center.',
    education: 'BSc Computer Science — American University of Sharjah',
    preferred_area: 'التدريب التقني',
    programIndex: 1,
    availability: 'مساء أيام الأسبوع',
    motivation: 'I want to help bridge the digital divide and teach practical skills to underserved communities.',
    status: 'under_review',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'أمل الحربي',
    email: 'amal.harbi@example.com',
    phone: '+966553334455',
    country: 'السعودية',
    date_of_birth: null,
    skills: ['الإسعافات الأولية', 'التمريض'],
    experience: 'ممرضة سابقة بخبرة خمس سنوات في القطاع الصحي.',
    education: 'دبلوم تمريض',
    preferred_area: 'الصحة المجتمعية',
    programIndex: 2,
    availability: 'دوام جزئي صباحي',
    motivation: 'أؤمن بأن الرعاية الصحية حق للجميع وأريد خدمة كبار السن في الأحياء البعيدة.',
    status: 'approved',
    rejection_reason: null,
    hasAvatar: false,
  },
  {
    full_name: 'Omar Khalil',
    email: 'omar.khalil@example.com',
    phone: null,
    country: 'الأردن',
    date_of_birth: '2001-01-15',
    skills: ['Photography', 'Social Media'],
    experience: null,
    education: 'طالب جامعي — السنة الثالثة إعلام',
    preferred_area: 'الإعلام والتوثيق',
    programIndex: 3,
    availability: 'مرن',
    motivation: 'أرغب بتوثيق الأثر المجتمعي للمبادرات البيئية ونشر الوعي عبر المنصات الرقمية.',
    status: 'pending',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'هدى العتيبي',
    email: 'huda.otaibi@example.com',
    phone: '+966544445566',
    country: 'السعودية',
    date_of_birth: '1992-07-08',
    skills: ['المحاسبة', 'إدارة المشاريع'],
    experience: 'محاسبة في شركة خاصة لمدة سبع سنوات.',
    education: 'بكالوريوس محاسبة',
    preferred_area: 'الدعم الإداري',
    programIndex: null,
    availability: 'عطلات نهاية الأسبوع',
    motivation: 'أبحث عن طريقة لرد الجميل لمجتمعي عبر خبرتي المهنية.',
    status: 'rejected',
    rejection_reason: 'لا تتوفر حالياً فرص تطوعية في مجال الدعم الإداري؛ نرحب بإعادة التقديم لاحقاً.',
    hasAvatar: false,
  },
  {
    full_name: 'Lina Saab',
    email: 'lina.saab@example.com',
    phone: '+961701234567',
    country: 'لبنان',
    date_of_birth: '1999-11-22',
    skills: ['Graphic Design', 'Illustration'],
    experience: 'Freelance designer; produced campaign visuals for two NGOs.',
    education: 'BA Graphic Design — LAU',
    preferred_area: 'التصميم والإبداع',
    programIndex: 0,
    availability: 'مرن — عن بُعد',
    motivation: 'Design can amplify important causes; I want my work to serve the community.',
    status: 'under_review',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'فهد الشهري',
    email: 'fahad.shehri@example.com',
    phone: '+966588776655',
    country: 'السعودية',
    date_of_birth: '1996-03-03',
    skills: ['القيادة', 'الخطابة', 'تنظيم الفرق'],
    experience: 'قائد فريق تطوعي في حملات موسمية لثلاث سنوات.',
    education: 'بكالوريوس علوم سياسية',
    preferred_area: 'قيادة الفرق',
    programIndex: 0,
    availability: 'أيام الجمعة والسبت',
    motivation: 'أطمح لتوسيع أثر العمل التطوعي المنظم في منطقتي.',
    status: 'approved',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'Mariam Fawzi',
    email: 'mariam.fawzi@example.com',
    phone: '+20100987654',
    country: 'مصر',
    date_of_birth: null,
    skills: ['Content Writing', 'Editing'],
    experience: 'Wrote educational content for an online learning platform.',
    education: 'BA Journalism — Cairo University',
    preferred_area: 'المحتوى التعليمي',
    programIndex: 1,
    availability: 'عن بُعد',
    motivation: 'أريد المساهمة في إنتاج محتوى عربي تعليمي عالي الجودة.',
    status: 'withdrawn',
    rejection_reason: null,
    hasAvatar: false,
  },
  {
    full_name: 'ناصر القحطاني',
    email: 'nasser.q@example.com',
    phone: '+966533221199',
    country: 'السعودية',
    date_of_birth: '1994-12-01',
    skills: ['الترجمة', 'التدقيق اللغوي'],
    experience: 'مترجم مستقل منذ أربع سنوات.',
    education: 'بكالوريوس لغات وترجمة',
    preferred_area: 'الترجمة',
    programIndex: 1,
    availability: 'مساءً',
    motivation: 'اللغة جسر للمعرفة وأرغب في جعل المحتوى متاحاً للجميع.',
    status: 'pending',
    rejection_reason: null,
    hasAvatar: false,
  },
  {
    full_name: 'Sara Haddad',
    email: 'sara.haddad@example.com',
    phone: '+962791112233',
    country: 'الأردن',
    date_of_birth: '2000-06-18',
    skills: ['First Aid', 'Event Support'],
    experience: null,
    education: 'طالبة تمريض — السنة الرابعة',
    preferred_area: 'الصحة المجتمعية',
    programIndex: 2,
    availability: 'عطلات نهاية الأسبوع',
    motivation: 'أريد اكتساب خبرة ميدانية حقيقية وخدمة المجتمع في الوقت نفسه.',
    status: 'pending',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'عبدالرحمن الدوسري',
    email: 'a.dossari@example.com',
    phone: '+966599881122',
    country: 'السعودية',
    date_of_birth: '1990-02-25',
    skills: ['إدارة اللوجستيات', 'القيادة الميدانية'],
    experience: 'منسق لوجستي في حملات إغاثية متعددة.',
    education: 'دبلوم إدارة سلاسل الإمداد',
    preferred_area: 'اللوجستيات',
    programIndex: 3,
    availability: 'دوام كامل خلال الحملات',
    motivation: 'الميدان مدرستي وأرغب في تسخير خبرتي لخدمة الحملات البيئية.',
    status: 'under_review',
    rejection_reason: null,
    hasAvatar: false,
  },
  {
    full_name: 'Yasmin Nour',
    email: 'yasmin.nour@example.com',
    phone: null,
    country: 'المغرب',
    date_of_birth: '1997-08-14',
    skills: ['Public Speaking', 'Workshop Facilitation'],
    experience: 'Facilitated youth workshops with a local association.',
    education: 'MA Education — Mohammed V University',
    preferred_area: 'التدريب والتيسير',
    programIndex: 0,
    availability: 'مرن',
    motivation: 'أؤمن بقدرة التعليم غير النظامي على تغيير مسارات الشباب.',
    status: 'rejected',
    rejection_reason: 'اكتمل عدد الميسرين المطلوب لهذه الدورة من البرنامج.',
    hasAvatar: true,
  },
  {
    full_name: 'تركي المطيري',
    email: 'turki.m@example.com',
    phone: '+966522113344',
    country: 'السعودية',
    date_of_birth: '2002-10-05',
    skills: ['التصوير', 'المونتاج'],
    experience: null,
    education: 'طالب — إنتاج إعلامي',
    preferred_area: 'الإعلام والتوثيق',
    programIndex: 3,
    availability: 'عطلات نهاية الأسبوع',
    motivation: 'أرغب في بناء معرض أعمال حقيقي عبر توثيق المبادرات البيئية.',
    status: 'pending',
    rejection_reason: null,
    hasAvatar: true,
  },
  {
    full_name: 'Rania Aziz',
    email: 'rania.aziz@example.com',
    phone: '+97333445566',
    country: 'البحرين',
    date_of_birth: '1993-05-27',
    skills: ['HR', 'Interviewing', 'Onboarding'],
    experience: 'HR specialist for six years; volunteer interviewer for a scholarship fund.',
    education: 'BSc Human Resources — University of Bahrain',
    preferred_area: 'شؤون المتطوعين',
    programIndex: null,
    availability: 'مساء أيام الأسبوع',
    motivation: 'أريد المساعدة في بناء تجربة متطوعين منظمة ومحفزة.',
    status: 'approved',
    rejection_reason: null,
    hasAvatar: false,
  },
];

let nextId = 3000;
let nextNoteId = 100;

const applications: VolunteerApplication[] = SEED.map((seed, index) => {
  const applied = new Date(2026, 4 + (index % 4), 2 + index * 2, 11);
  const { programIndex, hasAvatar, ...rest } = seed;
  const id = ++nextId;
  return {
    id,
    ...rest,
    avatar_url: hasAvatar
      ? `https://i.pravatar.cc/150?u=mujaddidun-volunteer-${index}`
      : null,
    program: programIndex === null ? null : PROGRAMS[programIndex],
    applied_at: applied.toISOString(),
    created_at: applied.toISOString(),
    updated_at: applied.toISOString(),
  };
});

const notesByApplication = new Map<number, ApplicationNote[]>([
  [
    applications[1].id,
    [
      {
        id: ++nextNoteId,
        body: 'تمت مقابلة المتقدم هاتفياً؛ يمتلك خبرة تقنية جيدة ويحتاج تقييم مهارات التدريس.',
        author_name: 'مدير النظام',
        created_at: new Date(2026, 6, 20, 14, 30).toISOString(),
      },
      {
        id: ++nextNoteId,
        body: 'Portfolio reviewed — strong web fundamentals. Recommend a trial session.',
        author_name: 'Moderator One',
        created_at: new Date(2026, 6, 22, 10, 15).toISOString(),
      },
    ],
  ],
  [
    applications[5].id,
    [
      {
        id: ++nextNoteId,
        body: 'نماذج التصميم المرفقة ممتازة، بانتظار تأكيد التفرغ خلال الحملة القادمة.',
        author_name: 'مدير النظام',
        created_at: new Date(2026, 6, 25, 9, 0).toISOString(),
      },
    ],
  ],
]);

const documentsByApplication = new Map<number, ApplicationDocument[]>([
  [
    applications[1].id,
    [
      {
        id: 1,
        name: 'karim-cv.pdf',
        file_type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploaded_at: new Date(2026, 6, 18, 12).toISOString(),
      },
      {
        id: 2,
        name: 'teaching-certificate.jpg',
        file_type: 'image/jpeg',
        url: 'https://picsum.photos/seed/mujaddidun-doc-cert/800/600',
        uploaded_at: new Date(2026, 6, 18, 12, 5).toISOString(),
      },
    ],
  ],
  [
    applications[2].id,
    [
      {
        id: 3,
        name: 'nursing-license.jpg',
        file_type: 'image/jpeg',
        url: 'https://picsum.photos/seed/mujaddidun-doc-license/800/600',
        uploaded_at: new Date(2026, 5, 10, 16).toISOString(),
      },
    ],
  ],
  [
    applications[5].id,
    [
      {
        id: 4,
        name: 'design-portfolio.pdf',
        file_type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploaded_at: new Date(2026, 6, 24, 11).toISOString(),
      },
    ],
  ],
]);

function findApplication(id: number): VolunteerApplication {
  const application = applications.find((a) => a.id === id);
  if (!application) throw new Error('Application not found');
  return application;
}

export const mockVolunteersDb = {
  async list(
    params: ApplicationsListParams,
  ): Promise<PaginatedResponse<VolunteerApplication>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = applications.filter((application) => {
      if (
        search &&
        !application.full_name.toLowerCase().includes(search) &&
        !application.email.toLowerCase().includes(search) &&
        !(application.phone ?? '').toLowerCase().includes(search)
      ) {
        return false;
      }
      if (params.status && application.status !== params.status) return false;
      if (
        params.program_id &&
        application.program?.id !== params.program_id
      ) {
        return false;
      }
      const date = application.applied_at.slice(0, 10);
      if (params.date_from && date < params.date_from) return false;
      if (params.date_to && date > params.date_to) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => b.applied_at.localeCompare(a.applied_at));

    const perPage = params.per_page ?? 10;
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    return {
      data: slice.map((application) => ({ ...application })),
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

  async statistics(): Promise<ApplicationStatistics> {
    await delay();
    const count = (status: ApplicationStatus) =>
      applications.filter((a) => a.status === status).length;
    return {
      total: applications.length,
      pending: count('pending'),
      under_review: count('under_review'),
      approved: count('approved'),
      rejected: count('rejected'),
    };
  },

  async programs(): Promise<VolunteerProgram[]> {
    await delay(150);
    return PROGRAMS.map((program) => ({ ...program }));
  },

  async get(id: number): Promise<VolunteerApplication> {
    await delay();
    return { ...findApplication(id) };
  },

  async setStatus(
    id: number,
    input: StatusChangeInput,
  ): Promise<VolunteerApplication> {
    await delay();
    const application = findApplication(id);
    if (!canTransition(application.status, input.status)) {
      throw new Error(
        `Cannot change application status from ${application.status} to ${input.status}`,
      );
    }
    if (input.status === 'rejected' && !input.rejection_reason?.trim()) {
      throw new Error('A rejection reason is required');
    }
    application.status = input.status;
    application.rejection_reason =
      input.status === 'rejected'
        ? (input.rejection_reason?.trim() ?? null)
        : null;
    application.updated_at = new Date().toISOString();
    return { ...application };
  },

  async notes(id: number): Promise<ApplicationNote[]> {
    await delay(250);
    findApplication(id);
    return (notesByApplication.get(id) ?? []).map((note) => ({ ...note }));
  },

  async addNote(id: number, body: string): Promise<ApplicationNote> {
    await delay();
    findApplication(id);
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Note body is required');
    const note: ApplicationNote = {
      id: ++nextNoteId,
      body: trimmed,
      author_name: 'مدير النظام',
      created_at: new Date().toISOString(),
    };
    const existing = notesByApplication.get(id) ?? [];
    notesByApplication.set(id, [...existing, note]);
    return { ...note };
  },

  async documents(id: number): Promise<ApplicationDocument[]> {
    await delay(250);
    findApplication(id);
    return (documentsByApplication.get(id) ?? []).map((doc) => ({ ...doc }));
  },
};
