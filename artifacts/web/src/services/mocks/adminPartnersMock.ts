import type { PaginatedResponse } from '@/services/adminNews';
import type {
  Partner,
  PartnerInput,
  PartnerStatus,
  PartnersListParams,
} from '@/services/adminPartners';

/** In-memory mock database emulating the Laravel Partners API. */

const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const SEED: Array<
  Pick<Partner, 'name_ar' | 'name_en' | 'type' | 'website_url'>
> = [
  { name_ar: 'مؤسسة النهضة للتنمية', name_en: 'Al-Nahda Development Foundation', type: 'strategic', website_url: 'https://alnahda.example.org' },
  { name_ar: 'بنك الأمانة', name_en: 'Al-Amana Bank', type: 'sponsor', website_url: 'https://amanabank.example.com' },
  { name_ar: 'قناة المستقبل', name_en: 'Al-Mustaqbal Channel', type: 'media', website_url: 'https://almustaqbal.example.tv' },
  { name_ar: 'جمعية العطاء الخيرية', name_en: 'Al-Ataa Charity Association', type: 'community', website_url: null },
  { name_ar: 'جامعة المعرفة', name_en: 'Al-Maarifa University', type: 'academic', website_url: 'https://maarifa.example.edu' },
  { name_ar: 'شركة الرواد للتقنية', name_en: 'Al-Ruwwad Tech Company', type: 'sponsor', website_url: 'https://ruwwad.example.com' },
  { name_ar: 'إذاعة صوت المجتمع', name_en: 'Community Voice Radio', type: 'media', website_url: null },
  { name_ar: 'مركز الشباب الحضري', name_en: 'Urban Youth Center', type: 'community', website_url: 'https://uyc.example.org' },
  { name_ar: 'معهد اللغات الدولي', name_en: 'International Languages Institute', type: 'academic', website_url: 'https://ili.example.edu' },
  { name_ar: 'مجموعة الخير القابضة', name_en: 'Al-Khair Holding Group', type: 'strategic', website_url: 'https://alkhair.example.com' },
  { name_ar: 'صحيفة الفجر', name_en: 'Al-Fajr Newspaper', type: 'media', website_url: 'https://alfajr.example.news' },
  { name_ar: 'شركة البركة للاستثمار', name_en: 'Al-Baraka Investment Company', type: 'sponsor', website_url: null },
];

let nextId = 900;

const partners: Partner[] = SEED.map((seed, index) => {
  const created = new Date(2026, 3 + (index % 4), 3 + index * 2, 10);
  return {
    id: ++nextId,
    ...seed,
    logo_url: `https://picsum.photos/seed/mujaddidun-partner-${index}/400/200`,
    description_ar: `شريك ${seed.name_ar} يدعم برامج ومبادرات المنصة.`,
    description_en: `${seed.name_en} supports the platform's programs and initiatives.`,
    display_order: index + 1,
    status: index % 4 === 3 ? 'inactive' : 'active',
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
  };
});

function findPartner(id: number): Partner {
  const partner = partners.find((p) => p.id === id);
  if (!partner) throw new Error('Partner not found');
  return partner;
}

async function applyInput(
  partner: Partner,
  input: PartnerInput,
): Promise<void> {
  partner.name_ar = input.name_ar;
  partner.name_en = input.name_en;
  partner.type = input.type;
  partner.website_url = input.website_url;
  partner.description_ar = input.description_ar;
  partner.description_en = input.description_en;
  partner.display_order = input.display_order;
  partner.status = input.status;
  if (input.logo) partner.logo_url = await fileToDataUrl(input.logo);
  partner.updated_at = new Date().toISOString();
}

export const mockPartnersDb = {
  async list(
    params: PartnersListParams,
  ): Promise<PaginatedResponse<Partner>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = partners.filter((partner) => {
      if (
        search &&
        !partner.name_ar.toLowerCase().includes(search) &&
        !partner.name_en.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (params.type && partner.type !== params.type) return false;
      if (params.status && partner.status !== params.status) return false;
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
      data: slice.map((partner) => ({ ...partner })),
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

  async get(id: number): Promise<Partner> {
    await delay();
    return { ...findPartner(id) };
  },

  async create(input: PartnerInput): Promise<Partner> {
    await delay();
    const now = new Date().toISOString();
    const partner: Partner = {
      id: ++nextId,
      name_ar: input.name_ar,
      name_en: input.name_en,
      logo_url: input.logo ? await fileToDataUrl(input.logo) : null,
      type: input.type,
      website_url: input.website_url,
      description_ar: input.description_ar,
      description_en: input.description_en,
      display_order: input.display_order,
      status: input.status,
      created_at: now,
      updated_at: now,
    };
    partners.push(partner);
    return { ...partner };
  },

  async update(id: number, input: PartnerInput): Promise<Partner> {
    await delay();
    const partner = findPartner(id);
    await applyInput(partner, input);
    return { ...partner };
  },

  async setStatus(id: number, status: PartnerStatus): Promise<Partner> {
    await delay();
    const partner = findPartner(id);
    partner.status = status;
    partner.updated_at = new Date().toISOString();
    return { ...partner };
  },

  /** Assigns display_order = index + 1 following the given id order. */
  async reorder(ids: number[]): Promise<Partner[]> {
    await delay();
    const now = new Date().toISOString();
    ids.forEach((id, index) => {
      const partner = partners.find((p) => p.id === id);
      if (partner) {
        partner.display_order = index + 1;
        partner.updated_at = now;
      }
    });
    return [...partners]
      .sort((a, b) => a.display_order - b.display_order)
      .map((partner) => ({ ...partner }));
  },

  async remove(id: number): Promise<void> {
    await delay();
    const index = partners.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Partner not found');
    partners.splice(index, 1);
  },
};
