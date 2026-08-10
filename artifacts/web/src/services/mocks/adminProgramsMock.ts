/**
 * Temporary in-memory programs + participants store emulating Laravel
 * server-side filtering, pagination, and image storage (data URLs stand
 * in for storage paths). Deleted once the API exists.
 */
import type {
  AdminProgram,
  ProgramCategory,
  ProgramInput,
  ProgramStatus,
  ProgramsListParams,
} from '../adminPrograms';
import type {
  ParticipantStatus,
  ParticipantsListParams,
  ProgramParticipant,
} from '../adminProgramParticipants';
import type { PaginatedResponse } from '../adminNews';

const AR_TITLES = [
  'برنامج تمكين الشباب القيادي',
  'برنامج محو الأمية الرقمية',
  'برنامج الصحة المجتمعية',
  'برنامج ريادة الأعمال للشباب',
  'برنامج الحفاظ على البيئة',
  'برنامج دعم الأسر المنتجة',
  'برنامج التوعية الصحية المدرسية',
  'برنامج المتطوع الصغير',
];
const EN_TITLES = [
  'Youth Leadership Empowerment Program',
  'Digital Literacy Program',
  'Community Health Program',
  'Youth Entrepreneurship Program',
  'Environmental Conservation Program',
  'Productive Families Support Program',
  'School Health Awareness Program',
  'Little Volunteer Program',
];
const CATEGORIES: ProgramCategory[] = [
  'youth',
  'education',
  'health',
  'community',
  'environment',
  'community',
  'health',
  'youth',
];
const AR_LOCATIONS = [
  'مقر مجددون - عمّان',
  'مراكز مجتمعية - إربد',
  'مدارس محافظة الزرقاء',
  'عن بُعد (أونلاين)',
];
const EN_LOCATIONS = [
  'Mujaddidun HQ - Amman',
  'Community Centers - Irbid',
  'Zarqa Governorate Schools',
  'Remote (Online)',
];
const PARTICIPANT_NAMES = [
  'أحمد الزعبي',
  'ليان الخطيب',
  'عمر حداد',
  'سارة النابلسي',
  'يوسف العمري',
  'رند القضاة',
  'محمد أبو زيد',
  'هالة الشريف',
  'Khaled Mansour',
  'Dana Haddad',
  'Lina Qasem',
  'Faris Odeh',
];

function description(ar: boolean, title: string): string {
  return ar
    ? `<h2>${title}</h2><p>برنامج مستمر تنفذه منصة مجددون بالشراكة مع مؤسسات المجتمع المحلي، ويستهدف بناء القدرات وتنمية المهارات.</p><ul><li>جلسات تدريبية أسبوعية</li><li>مرافقة وإرشاد من مختصين</li><li>شهادات إتمام معتمدة</li></ul>`
    : `<h2>${title}</h2><p>An ongoing program run by Mujaddidun in partnership with local community organizations, focused on capacity building and skills development.</p><ul><li>Weekly training sessions</li><li>Mentoring by specialists</li><li>Certified completion certificates</li></ul>`;
}

const TODAY = new Date('2026-08-10T00:00:00Z');

function isoDate(offsetDays: number): string {
  return new Date(TODAY.getTime() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function buildPrograms(): AdminProgram[] {
  const items: AdminProgram[] = [];
  for (let i = 1; i <= 17; i++) {
    const idx = i % AR_TITLES.length;
    const status: ProgramStatus =
      i % 8 === 0
        ? 'archived'
        : i % 5 === 0
          ? 'draft'
          : i % 3 === 0
            ? 'completed'
            : 'active';
    const startOffset =
      status === 'completed' ? -120 - i : status === 'active' ? -10 - i : 10 + i;
    const startDate = isoDate(startOffset);
    const endDate = isoDate(startOffset + 60 + i);
    const max = 40 + (i % 5) * 20;
    const count =
      status === 'draft' ? 0 : Math.min(max, 6 + ((i * 9) % (max - 3)));
    const created = new Date(TODAY.getTime() - (60 + i * 2) * 86_400_000);
    items.push({
      id: 500 + i,
      title_ar: `${AR_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      title_en: `${EN_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      excerpt_ar:
        'برنامج تنموي يهدف إلى بناء قدرات الفئات المستهدفة وتمكينها من إحداث أثر إيجابي في مجتمعها.',
      excerpt_en:
        'A development program aimed at building the capacities of target groups and empowering them to create positive impact.',
      description_ar: description(true, AR_TITLES[idx]),
      description_en: description(false, EN_TITLES[idx]),
      category: CATEGORIES[idx],
      target_audience_ar: 'الشباب من عمر 16 إلى 30 عامًا',
      target_audience_en: 'Youth aged 16 to 30',
      location_ar: AR_LOCATIONS[i % AR_LOCATIONS.length],
      location_en: EN_LOCATIONS[i % EN_LOCATIONS.length],
      start_date: startDate,
      end_date: endDate,
      max_participants: max,
      objectives_ar:
        'تنمية المهارات القيادية\nتعزيز روح العمل الجماعي\nبناء شبكة علاقات مهنية',
      objectives_en:
        'Develop leadership skills\nFoster teamwork spirit\nBuild a professional network',
      requirements_ar:
        'الالتزام بحضور 80% من الجلسات\nإتمام مشروع التخرج\nالعمر ضمن الفئة المستهدفة',
      requirements_en:
        'Commit to attending 80% of sessions\nComplete the graduation project\nAge within the target group',
      status,
      participants_count: count,
      image_url: null,
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + 86_400_000).toISOString(),
    });
  }
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function buildParticipants(programs: AdminProgram[]): ProgramParticipant[] {
  const rows: ProgramParticipant[] = [];
  let id = 12000;
  for (const program of programs) {
    for (let j = 0; j < program.participants_count; j++) {
      const name = PARTICIPANT_NAMES[(id + j) % PARTICIPANT_NAMES.length];
      const status: ParticipantStatus =
        program.status === 'completed'
          ? j % 5 === 0
            ? 'rejected'
            : 'completed'
          : j % 4 === 0
            ? 'pending'
            : j % 9 === 0
              ? 'rejected'
              : 'approved';
      rows.push({
        id: id++,
        program_id: program.id,
        participant_name: `${name} ${j + 1}`,
        email: `participant${id}@example.com`,
        phone: `+9627${String(90000000 + id).slice(0, 8)}`,
        status,
        registered_at: new Date(
          new Date(program.created_at).getTime() + (j + 1) * 86_400_000,
        ).toISOString(),
      });
    }
  }
  return rows;
}

let programs = buildPrograms();
let participants = buildParticipants(programs);
let nextProgramId = 600;

const delay = () => new Promise((r) => setTimeout(r, 300));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function matches(program: AdminProgram, params: ProgramsListParams): boolean {
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    if (
      !program.title_ar.toLowerCase().includes(q) &&
      !program.title_en.toLowerCase().includes(q)
    )
      return false;
  }
  if (params.category && program.category !== params.category) return false;
  if (params.status && program.status !== params.status) return false;
  if (params.date_from && program.end_date < params.date_from) return false;
  if (params.date_to && program.start_date > params.date_to) return false;
  return true;
}

function paginate<T>(
  rows: T[],
  page = 1,
  perPage = 10,
): PaginatedResponse<T> {
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(Math.max(page, 1), lastPage);
  const start = (current - 1) * perPage;
  const slice = rows.slice(start, start + perPage);
  return {
    data: slice,
    meta: {
      current_page: current,
      last_page: lastPage,
      per_page: perPage,
      total: rows.length,
      from: slice.length ? start + 1 : null,
      to: slice.length ? start + slice.length : null,
    },
  };
}

async function applyInput(program: AdminProgram, input: ProgramInput) {
  Object.assign(program, {
    title_ar: input.title_ar,
    title_en: input.title_en,
    excerpt_ar: input.excerpt_ar,
    excerpt_en: input.excerpt_en,
    description_ar: input.description_ar,
    description_en: input.description_en,
    category: input.category,
    target_audience_ar: input.target_audience_ar,
    target_audience_en: input.target_audience_en,
    location_ar: input.location_ar,
    location_en: input.location_en,
    start_date: input.start_date,
    end_date: input.end_date,
    max_participants: input.max_participants,
    objectives_ar: input.objectives_ar,
    objectives_en: input.objectives_en,
    requirements_ar: input.requirements_ar,
    requirements_en: input.requirements_en,
    status: input.status,
    updated_at: new Date().toISOString(),
  });
  if (input.remove_image) program.image_url = null;
  if (input.image) program.image_url = await fileToDataUrl(input.image);
}

export const mockProgramsDb = {
  async list(
    params: ProgramsListParams,
  ): Promise<PaginatedResponse<AdminProgram>> {
    await delay();
    const filtered = programs.filter((p) => matches(p, params));
    const page = paginate(filtered, params.page, params.per_page);
    return { ...page, data: page.data.map((p) => ({ ...p })) };
  },

  async get(id: number): Promise<AdminProgram> {
    await delay();
    const program = programs.find((p) => p.id === id);
    if (!program) throw new Error('Program not found');
    return { ...program };
  },

  async create(input: ProgramInput): Promise<AdminProgram> {
    await delay();
    const now = new Date().toISOString();
    const program = {
      id: nextProgramId++,
      participants_count: 0,
      image_url: null,
      created_at: now,
      updated_at: now,
    } as AdminProgram;
    await applyInput(program, input);
    programs = [program, ...programs];
    return { ...program };
  },

  async update(id: number, input: ProgramInput): Promise<AdminProgram> {
    await delay();
    const program = programs.find((p) => p.id === id);
    if (!program) throw new Error('Program not found');
    await applyInput(program, input);
    return { ...program };
  },

  async setStatus(id: number, status: ProgramStatus): Promise<AdminProgram> {
    await delay();
    const program = programs.find((p) => p.id === id);
    if (!program) throw new Error('Program not found');
    program.status = status;
    program.updated_at = new Date().toISOString();
    return { ...program };
  },

  async remove(id: number): Promise<void> {
    await delay();
    programs = programs.filter((p) => p.id !== id);
    participants = participants.filter((r) => r.program_id !== id);
  },

  async listParticipants(
    programId: number,
    params: ParticipantsListParams,
  ): Promise<PaginatedResponse<ProgramParticipant>> {
    await delay();
    const rows = participants
      .filter((r) => r.program_id === programId)
      .filter((r) => {
        if (params.status && r.status !== params.status) return false;
        if (params.search) {
          const q = params.search.trim().toLowerCase();
          return (
            r.participant_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.phone.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.registered_at.localeCompare(a.registered_at));
    const page = paginate(rows, params.page, params.per_page);
    return { ...page, data: page.data.map((r) => ({ ...r })) };
  },

  async setParticipantStatus(
    id: number,
    status: ParticipantStatus,
  ): Promise<ProgramParticipant> {
    await delay();
    const row = participants.find((r) => r.id === id);
    if (!row) throw new Error('Participant not found');
    const wasRejected = row.status === 'rejected';
    const willBeRejected = status === 'rejected';
    /**
     * Keep program capacity consistent: rejecting releases the seat,
     * re-approving a rejected participant takes it again — but only if
     * a seat is still available. The Laravel API must enforce the same
     * transition rules atomically.
     */
    const program = programs.find((p) => p.id === row.program_id);
    if (
      program &&
      wasRejected &&
      !willBeRejected &&
      program.participants_count >= program.max_participants
    ) {
      throw new Error(
        'Program is at full capacity; no seat is available for this participant.',
      );
    }
    row.status = status;
    if (program && wasRejected !== willBeRejected) {
      program.participants_count = Math.max(
        0,
        program.participants_count + (willBeRejected ? -1 : 1),
      );
      program.updated_at = new Date().toISOString();
    }
    return { ...row };
  },
};
