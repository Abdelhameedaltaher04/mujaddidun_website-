/**
 * Temporary in-memory events + registrations store emulating Laravel
 * server-side filtering, pagination, and image storage (data URLs stand
 * in for storage paths). Deleted once the API exists.
 */
import type {
  AdminEvent,
  EventInput,
  EventStatus,
  EventsListParams,
} from '../adminEvents';
import type {
  EventRegistration,
  RegistrationStatus,
  RegistrationsListParams,
} from '../adminEventRegistrations';
import type { PaginatedResponse } from '../adminNews';

const AR_TITLES = [
  'ملتقى الشباب التطوعي السنوي',
  'ورشة إعداد قادة المستقبل',
  'حملة زراعة الأشجار في عمّان',
  'يوم مفتوح للأسر المستفيدة',
  'دورة الإسعافات الأولية',
  'معرض المشاريع الشبابية',
  'إفطار رمضاني خيري',
  'ماراثون مجددون الخيري',
];
const EN_TITLES = [
  'Annual Volunteer Youth Forum',
  'Future Leaders Preparation Workshop',
  'Tree Planting Campaign in Amman',
  'Open Day for Beneficiary Families',
  'First Aid Training Course',
  'Youth Projects Exhibition',
  'Charity Ramadan Iftar',
  'Mujaddidun Charity Marathon',
];
const AR_LOCATIONS = [
  'مقر مجددون - عمّان',
  'حدائق الحسين',
  'مركز زها الثقافي',
  'جامعة الأردن',
];
const EN_LOCATIONS = [
  'Mujaddidun HQ - Amman',
  'Al Hussein Gardens',
  'Zaha Cultural Center',
  'University of Jordan',
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
    ? `<h2>${title}</h2><p>تنظم منصة مجددون هذه الفعالية ضمن برامجها المجتمعية، بمشاركة نخبة من المدربين والمتطوعين.</p><ul><li>أنشطة تفاعلية متنوعة</li><li>شهادات مشاركة</li><li>ضيافة كاملة</li></ul><p>الأماكن محدودة، سارعوا بالتسجيل.</p>`
    : `<h2>${title}</h2><p>Mujaddidun organizes this event as part of its community programs, featuring distinguished trainers and volunteers.</p><ul><li>Varied interactive activities</li><li>Participation certificates</li><li>Full hospitality</li></ul><p>Seats are limited — register early.</p>`;
}

const TODAY = new Date('2026-08-10T00:00:00Z');

function isoDate(offsetDays: number): string {
  return new Date(TODAY.getTime() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function buildEvents(): AdminEvent[] {
  const items: AdminEvent[] = [];
  for (let i = 1; i <= 19; i++) {
    const idx = i % AR_TITLES.length;
    const status: EventStatus =
      i % 9 === 0
        ? 'cancelled'
        : i % 5 === 0
          ? 'draft'
          : i % 3 === 0
            ? 'completed'
            : i === 2
              ? 'ongoing'
              : 'upcoming';
    const dayOffset =
      status === 'completed' ? -20 - i : status === 'ongoing' ? 0 : 5 + i * 3;
    const eventDate = isoDate(dayOffset);
    const max = 30 + (i % 4) * 20;
    const count =
      status === 'draft' ? 0 : Math.min(max, 4 + ((i * 7) % (max - 2)));
    const created = new Date(TODAY.getTime() - (40 + i) * 86_400_000);
    items.push({
      id: 300 + i,
      title_ar: `${AR_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      title_en: `${EN_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      excerpt_ar:
        'فعالية مجتمعية تهدف إلى تمكين الشباب وتعزيز روح العمل التطوعي في المجتمع المحلي.',
      excerpt_en:
        'A community event aimed at empowering youth and promoting volunteerism in the local community.',
      description_ar: description(true, AR_TITLES[idx]),
      description_en: description(false, EN_TITLES[idx]),
      location_ar: AR_LOCATIONS[i % AR_LOCATIONS.length],
      location_en: EN_LOCATIONS[i % EN_LOCATIONS.length],
      event_date: eventDate,
      start_time: i % 2 === 0 ? '10:00' : '16:00',
      end_time: i % 2 === 0 ? '14:00' : '20:00',
      max_participants: max,
      registration_start_date: isoDate(dayOffset - 30),
      registration_end_date: isoDate(dayOffset - 1),
      registration_status:
        status === 'upcoming' || status === 'ongoing' ? 'open' : 'closed',
      status,
      registrations_count: count,
      image_url: null,
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + 86_400_000).toISOString(),
    });
  }
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function buildRegistrations(events: AdminEvent[]): EventRegistration[] {
  const regs: EventRegistration[] = [];
  let id = 9000;
  for (const event of events) {
    for (let j = 0; j < event.registrations_count; j++) {
      const name = PARTICIPANT_NAMES[(id + j) % PARTICIPANT_NAMES.length];
      const status: RegistrationStatus =
        event.status === 'completed'
          ? j % 4 === 0
            ? 'cancelled'
            : 'attended'
          : j % 5 === 0
            ? 'pending'
            : j % 7 === 0
              ? 'cancelled'
              : 'confirmed';
      regs.push({
        id: id++,
        event_id: event.id,
        participant_name: `${name} ${j + 1}`,
        email: `participant${id}@example.com`,
        phone: `+9627${String(90000000 + id).slice(0, 8)}`,
        status,
        registered_at: new Date(
          new Date(event.created_at).getTime() + (j + 1) * 43_200_000,
        ).toISOString(),
      });
    }
  }
  return regs;
}

let events = buildEvents();
let registrations = buildRegistrations(events);
let nextEventId = 400;

const delay = () => new Promise((r) => setTimeout(r, 300));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function matches(event: AdminEvent, params: EventsListParams): boolean {
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    if (
      !event.title_ar.toLowerCase().includes(q) &&
      !event.title_en.toLowerCase().includes(q)
    )
      return false;
  }
  if (params.status && event.status !== params.status) return false;
  if (
    params.registration_status &&
    event.registration_status !== params.registration_status
  )
    return false;
  if (params.date_from && event.event_date < params.date_from) return false;
  if (params.date_to && event.event_date > params.date_to) return false;
  if (params.location) {
    const q = params.location.trim().toLowerCase();
    if (
      !event.location_ar.toLowerCase().includes(q) &&
      !event.location_en.toLowerCase().includes(q)
    )
      return false;
  }
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

async function applyInput(event: AdminEvent, input: EventInput) {
  Object.assign(event, {
    title_ar: input.title_ar,
    title_en: input.title_en,
    excerpt_ar: input.excerpt_ar,
    excerpt_en: input.excerpt_en,
    description_ar: input.description_ar,
    description_en: input.description_en,
    location_ar: input.location_ar,
    location_en: input.location_en,
    event_date: input.event_date,
    start_time: input.start_time,
    end_time: input.end_time,
    max_participants: input.max_participants,
    registration_start_date: input.registration_start_date,
    registration_end_date: input.registration_end_date,
    registration_status: input.registration_status,
    status: input.status,
    updated_at: new Date().toISOString(),
  });
  if (input.remove_image) event.image_url = null;
  if (input.image) event.image_url = await fileToDataUrl(input.image);
}

export const mockEventsDb = {
  async list(
    params: EventsListParams,
  ): Promise<PaginatedResponse<AdminEvent>> {
    await delay();
    const filtered = events.filter((e) => matches(e, params));
    const page = paginate(filtered, params.page, params.per_page);
    return { ...page, data: page.data.map((e) => ({ ...e })) };
  },

  async get(id: number): Promise<AdminEvent> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    return { ...event };
  },

  async create(input: EventInput): Promise<AdminEvent> {
    await delay();
    const now = new Date().toISOString();
    const event = {
      id: nextEventId++,
      registrations_count: 0,
      image_url: null,
      created_at: now,
      updated_at: now,
    } as AdminEvent;
    await applyInput(event, input);
    events = [event, ...events];
    return { ...event };
  },

  async update(id: number, input: EventInput): Promise<AdminEvent> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    await applyInput(event, input);
    return { ...event };
  },

  async setPublished(id: number, publish: boolean): Promise<AdminEvent> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    event.status = publish ? 'upcoming' : 'draft';
    event.updated_at = new Date().toISOString();
    return { ...event };
  },

  async cancel(id: number): Promise<AdminEvent> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    event.status = 'cancelled';
    event.registration_status = 'closed';
    event.updated_at = new Date().toISOString();
    return { ...event };
  },

  async remove(id: number): Promise<void> {
    await delay();
    events = events.filter((e) => e.id !== id);
    registrations = registrations.filter((r) => r.event_id !== id);
  },

  async listRegistrations(
    eventId: number,
    params: RegistrationsListParams,
  ): Promise<PaginatedResponse<EventRegistration>> {
    await delay();
    const rows = registrations
      .filter((r) => r.event_id === eventId)
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

  async setRegistrationStatus(
    id: number,
    status: RegistrationStatus,
  ): Promise<EventRegistration> {
    await delay();
    const reg = registrations.find((r) => r.id === id);
    if (!reg) throw new Error('Registration not found');
    const wasCancelled = reg.status === 'cancelled';
    const willBeCancelled = status === 'cancelled';
    reg.status = status;
    /**
     * Keep event capacity consistent: cancelling releases the seat,
     * reinstating (cancelled -> any active status) takes it again.
     * The Laravel API must apply the same transition rules.
     */
    const event = events.find((e) => e.id === reg.event_id);
    if (event && wasCancelled !== willBeCancelled) {
      event.registrations_count = Math.max(
        0,
        event.registrations_count + (willBeCancelled ? -1 : 1),
      );
      event.updated_at = new Date().toISOString();
    }
    return { ...reg };
  },
};
