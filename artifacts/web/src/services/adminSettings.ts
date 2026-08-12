import { apiClient, type ApiEnvelope } from '@/services/api';

/**
 * Website Settings service (admin only — Laravel policies must reject
 * moderators on every PUT endpoint).
 *
 * Documented Laravel endpoints (bearer token):
 * - GET /settings                 all sections in one payload
 * - PUT /settings/general         multipart (logo / favicon files)
 * - PUT /settings/contact
 * - PUT /settings/social
 * - PUT /settings/branding        multipart (logo files)
 * - PUT /settings/seo             multipart (og image file)
 * - PUT /settings/email           sender/reply-to display config ONLY —
 *        SMTP host/credentials live exclusively in Laravel config/secrets
 *        and are never sent to or from the frontend.
 * - PUT /settings/controls
 *
 * Image fields are sent as multipart uploads with `remove_<field>` flags,
 * mirroring the News featured-image contract.
 * the Laravel API is connected.
 */

export const SETTINGS_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];
export const SETTINGS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 160;

export const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'whatsapp',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface GeneralSettings {
  site_name_ar: string;
  site_name_en: string;
  description_ar: string;
  description_en: string;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address_ar: string;
  address_en: string;
  maps_url: string;
  working_hours_ar: string;
  working_hours_en: string;
}

export interface SocialLink {
  /** URL for link platforms; E.164 number for WhatsApp. */
  value: string;
  enabled: boolean;
}

export type SocialSettings = Record<SocialPlatform, SocialLink>;

export interface BrandingSettings {
  primary_logo_url: string | null;
  footer_logo_url: string | null;
  favicon_url: string | null;
  website_title: string;
  default_language: 'ar' | 'en';
}

export interface SeoSettings {
  meta_title_ar: string;
  meta_title_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  keywords: string;
  og_image_url: string | null;
}

/**
 * Public-safe email display settings only. SMTP credentials are
 * intentionally absent from this type.
 */
export interface EmailSettings {
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
}

export interface ControlsSettings {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  allow_event_registrations: boolean;
  allow_volunteer_applications: boolean;
  show_donations: boolean;
  show_partners: boolean;
  show_faqs: boolean;
}

export interface SiteSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  social: SocialSettings;
  branding: BrandingSettings;
  seo: SeoSettings;
  email: EmailSettings;
  controls: ControlsSettings;
}

/** File payloads accompanying image-bearing sections. */
export interface GeneralFiles {
  logo?: File | null;
  remove_logo?: boolean;
  favicon?: File | null;
  remove_favicon?: boolean;
}

export interface BrandingFiles {
  primary_logo?: File | null;
  remove_primary_logo?: boolean;
  footer_logo?: File | null;
  remove_footer_logo?: boolean;
  favicon?: File | null;
  remove_favicon?: boolean;
}

export interface SeoFiles {
  og_image?: File | null;
  remove_og_image?: boolean;
}

function buildFormData(
  fields: Record<string, unknown>,
  files: Record<string, File | null | boolean | undefined>,
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
  Object.entries(files).forEach(([key, value]) => {
    if (value instanceof File) form.append(key, value);
    else if (typeof value === 'boolean') form.append(key, value ? '1' : '0');
  });
  // PHP cannot parse multipart bodies on real PUT requests, so multipart
  // sections use Laravel method spoofing (POST + _method=PUT).
  form.append('_method', 'PUT');
  return form;
}

/**
 * The API stores unset text settings as NULL, but the form components
 * (inputs, phone fields) require strings. Normalize every nullable text
 * field to '' so a fresh/partial settings row can never crash the UI.
 */
function normalizeSiteSettings(settings: SiteSettings): SiteSettings {
  const s = (value: unknown): string => (typeof value === 'string' ? value : '');
  const contact = settings.contact ?? ({} as ContactSettings);
  const social = settings.social ?? ({} as SocialSettings);
  return {
    ...settings,
    contact: {
      phone: s(contact.phone),
      whatsapp: s(contact.whatsapp),
      email: s(contact.email),
      address_ar: s(contact.address_ar),
      address_en: s(contact.address_en),
      maps_url: s(contact.maps_url),
      working_hours_ar: s(contact.working_hours_ar),
      working_hours_en: s(contact.working_hours_en),
    },
    social: Object.fromEntries(
      SOCIAL_PLATFORMS.map((platform) => {
        const entry = social[platform];
        return [platform, { value: s(entry?.value), enabled: Boolean(entry?.enabled) }];
      }),
    ) as SocialSettings,
    email: {
      sender_name: s(settings.email?.sender_name),
      sender_email: s(settings.email?.sender_email),
      reply_to_email: s(settings.email?.reply_to_email),
    },
  };
}

export const adminSettingsApi = {
  /** GET /settings */
  async get(): Promise<SiteSettings> {
    const response =
      await apiClient.get<ApiEnvelope<SiteSettings>>('/settings');
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/general (multipart) */
  async updateGeneral(
    input: Omit<GeneralSettings, 'logo_url' | 'favicon_url'>,
    files: GeneralFiles,
  ): Promise<SiteSettings> {
    const response = await apiClient.post<ApiEnvelope<SiteSettings>>(
      '/settings/general',
      buildFormData({ ...input }, { ...files }),
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/contact */
  async updateContact(input: ContactSettings): Promise<SiteSettings> {
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/contact',
      input,
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/social */
  async updateSocial(input: SocialSettings): Promise<SiteSettings> {
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/social',
      input,
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/branding (multipart) */
  async updateBranding(
    input: Omit<
      BrandingSettings,
      'primary_logo_url' | 'footer_logo_url' | 'favicon_url'
    >,
    files: BrandingFiles,
  ): Promise<SiteSettings> {
    const response = await apiClient.post<ApiEnvelope<SiteSettings>>(
      '/settings/branding',
      buildFormData({ ...input }, { ...files }),
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/seo (multipart) */
  async updateSeo(
    input: Omit<SeoSettings, 'og_image_url'>,
    files: SeoFiles,
  ): Promise<SiteSettings> {
    const response = await apiClient.post<ApiEnvelope<SiteSettings>>(
      '/settings/seo',
      buildFormData({ ...input }, { ...files }),
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/email — display config only, never SMTP credentials. */
  async updateEmail(input: EmailSettings): Promise<SiteSettings> {
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/email',
      input,
    );
    return normalizeSiteSettings(response.data.data);
  },

  /** PUT /settings/controls */
  async updateControls(input: ControlsSettings): Promise<SiteSettings> {
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/controls',
      input,
    );
    return normalizeSiteSettings(response.data.data);
  },
};
