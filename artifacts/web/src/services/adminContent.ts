import { apiClient, type ApiEnvelope } from '@/services/api';

/**
 * Admin Website Content API.
 *
 * Endpoints (bearer auth, admin only — WebsiteSettingPolicy):
 * - GET    /content                        full payload
 * - PUT    /content/{hero|about|vision_mission|footer}
 *          (hero/about are multipart: POST + _method=PUT)
 * - POST   /content/statistics             create
 * - PUT    /content/statistics/{id}        update
 * - DELETE /content/statistics/{id}        delete
 * - PATCH  /content/statistics/reorder     {ids: number[]} (all ids, new order)
 * - POST   /content/ctas                   create (multipart)
 * - PUT    /content/ctas/{id}              update (multipart POST + _method=PUT)
 * - DELETE /content/ctas/{id}              delete
 * - PATCH  /content/ctas/reorder           {ids: number[]}
 * - PUT    /content/homepage-sections      {sections: [{section_key, is_visible}]}
 *          in desired display order; must include every section exactly once.
 */

export const CONTENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface HeroContent {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  primary_button_text_ar: string;
  primary_button_text_en: string;
  primary_button_url: string;
  secondary_button_text_ar: string;
  secondary_button_text_en: string;
  secondary_button_url: string;
  background_image_url: string | null;
  is_active: boolean;
}

export interface AboutContent {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image_url: string | null;
  is_active: boolean;
}

export interface VisionMissionContent {
  vision_ar: string;
  vision_en: string;
  mission_ar: string;
  mission_en: string;
  is_active: boolean;
}

export interface FooterContent {
  description_ar: string;
  description_en: string;
  /** May contain a literal `{year}` placeholder replaced at render time. */
  copyright_ar: string;
  copyright_en: string;
}

export interface SiteStatistic {
  id: number;
  number: string;
  label_ar: string;
  label_en: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CtaSection {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  button_text_ar: string | null;
  button_text_en: string | null;
  button_url: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export const HOMEPAGE_SECTION_KEYS = [
  'hero',
  'statistics',
  'about',
  'programs',
  'news_events',
  'volunteer_cta',
  'partners',
  'faq',
  'contact',
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export interface HomepageSection {
  id?: number;
  section_key: HomepageSectionKey;
  is_visible: boolean;
  display_order: number;
}

export interface WebsiteContent {
  sections: {
    hero: HeroContent;
    about: AboutContent;
    vision_mission: VisionMissionContent;
    footer: FooterContent;
  };
  statistics: SiteStatistic[];
  ctas: CtaSection[];
  homepage_sections: HomepageSection[];
}

export interface StatisticInput {
  number: string;
  label_ar: string;
  label_en: string;
  icon: string | null;
  is_active: boolean;
}

export interface CtaInput {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  button_text_ar: string;
  button_text_en: string;
  button_url: string;
  is_active: boolean;
}

export interface CtaFiles {
  image?: File | null;
  remove_image?: boolean;
}

const s = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Nullable text from the API must never reach form inputs as null. */
function normalizeContent(content: WebsiteContent): WebsiteContent {
  const hero = content.sections.hero;
  const about = content.sections.about;
  const vm = content.sections.vision_mission;
  const footer = content.sections.footer;
  return {
    ...content,
    sections: {
      hero: {
        ...hero,
        title_ar: s(hero.title_ar),
        title_en: s(hero.title_en),
        description_ar: s(hero.description_ar),
        description_en: s(hero.description_en),
        primary_button_text_ar: s(hero.primary_button_text_ar),
        primary_button_text_en: s(hero.primary_button_text_en),
        primary_button_url: s(hero.primary_button_url),
        secondary_button_text_ar: s(hero.secondary_button_text_ar),
        secondary_button_text_en: s(hero.secondary_button_text_en),
        secondary_button_url: s(hero.secondary_button_url),
        is_active: Boolean(hero.is_active),
      },
      about: {
        ...about,
        title_ar: s(about.title_ar),
        title_en: s(about.title_en),
        description_ar: s(about.description_ar),
        description_en: s(about.description_en),
        is_active: Boolean(about.is_active),
      },
      vision_mission: {
        vision_ar: s(vm.vision_ar),
        vision_en: s(vm.vision_en),
        mission_ar: s(vm.mission_ar),
        mission_en: s(vm.mission_en),
        is_active: Boolean(vm.is_active),
      },
      footer: {
        description_ar: s(footer.description_ar),
        description_en: s(footer.description_en),
        copyright_ar: s(footer.copyright_ar),
        copyright_en: s(footer.copyright_en),
      },
    },
  };
}

function buildFormData(
  fields: Record<string, unknown>,
  files: Record<string, File | null | boolean | undefined>,
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (typeof value === 'boolean') form.append(key, value ? '1' : '0');
    else form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
  Object.entries(files).forEach(([key, value]) => {
    if (value instanceof File) form.append(key, value);
    else if (typeof value === 'boolean') form.append(key, value ? '1' : '0');
  });
  // PHP cannot parse multipart bodies on real PUT requests (method spoofing).
  form.append('_method', 'PUT');
  return form;
}

export const adminContentApi = {
  async get(): Promise<WebsiteContent> {
    const response = await apiClient.get<ApiEnvelope<WebsiteContent>>('/content');
    return normalizeContent(response.data.data);
  },

  /** PUT /content/hero (multipart). */
  async updateHero(
    input: Omit<HeroContent, 'background_image_url'>,
    files: { background_image?: File | null; remove_background_image?: boolean },
  ): Promise<WebsiteContent> {
    const response = await apiClient.post<ApiEnvelope<WebsiteContent>>(
      '/content/hero',
      buildFormData({ ...input }, { ...files }),
    );
    return normalizeContent(response.data.data);
  },

  /** PUT /content/about (multipart). */
  async updateAbout(
    input: Omit<AboutContent, 'image_url'>,
    files: { image?: File | null; remove_image?: boolean },
  ): Promise<WebsiteContent> {
    const response = await apiClient.post<ApiEnvelope<WebsiteContent>>(
      '/content/about',
      buildFormData({ ...input }, { ...files }),
    );
    return normalizeContent(response.data.data);
  },

  async updateVisionMission(input: VisionMissionContent): Promise<WebsiteContent> {
    const response = await apiClient.put<ApiEnvelope<WebsiteContent>>(
      '/content/vision_mission',
      input,
    );
    return normalizeContent(response.data.data);
  },

  async updateFooter(input: FooterContent): Promise<WebsiteContent> {
    const response = await apiClient.put<ApiEnvelope<WebsiteContent>>(
      '/content/footer',
      input,
    );
    return normalizeContent(response.data.data);
  },

  async createStatistic(input: StatisticInput): Promise<SiteStatistic> {
    const response = await apiClient.post<ApiEnvelope<SiteStatistic>>(
      '/content/statistics',
      input,
    );
    return response.data.data;
  },

  async updateStatistic(id: number, input: StatisticInput): Promise<SiteStatistic> {
    const response = await apiClient.put<ApiEnvelope<SiteStatistic>>(
      `/content/statistics/${id}`,
      input,
    );
    return response.data.data;
  },

  async deleteStatistic(id: number): Promise<void> {
    await apiClient.delete(`/content/statistics/${id}`);
  },

  /** All statistic ids in the desired order. */
  async reorderStatistics(ids: number[]): Promise<SiteStatistic[]> {
    const response = await apiClient.patch<ApiEnvelope<SiteStatistic[]>>(
      '/content/statistics/reorder',
      { ids },
    );
    return response.data.data;
  },

  async createCta(input: CtaInput, files: CtaFiles): Promise<CtaSection> {
    const form = buildFormData({ ...input }, { ...files });
    form.delete('_method'); // real POST for create
    const response = await apiClient.post<ApiEnvelope<CtaSection>>('/content/ctas', form);
    return response.data.data;
  },

  async updateCta(id: number, input: CtaInput, files: CtaFiles): Promise<CtaSection> {
    const response = await apiClient.post<ApiEnvelope<CtaSection>>(
      `/content/ctas/${id}`,
      buildFormData({ ...input }, { ...files }),
    );
    return response.data.data;
  },

  async deleteCta(id: number): Promise<void> {
    await apiClient.delete(`/content/ctas/${id}`);
  },

  async reorderCtas(ids: number[]): Promise<CtaSection[]> {
    const response = await apiClient.patch<ApiEnvelope<CtaSection[]>>(
      '/content/ctas/reorder',
      { ids },
    );
    return response.data.data;
  },

  /** Every section exactly once, in the desired display order. */
  async updateHomepageSections(
    sections: Array<{ section_key: HomepageSectionKey; is_visible: boolean }>,
  ): Promise<HomepageSection[]> {
    const response = await apiClient.put<ApiEnvelope<HomepageSection[]>>(
      '/content/homepage-sections',
      { sections },
    );
    return response.data.data;
  },
};
