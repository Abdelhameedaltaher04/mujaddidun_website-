import { apiClient, type ApiEnvelope } from '@/services/api';
import { mockSettingsDb } from '@/services/mocks/adminSettingsMock';

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
 * mirroring the News featured-image contract. Swap USE_MOCK to false once
 * the Laravel API is connected.
 */
const USE_MOCK = true;

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
  return form;
}

export const adminSettingsApi = {
  /** GET /settings */
  async get(): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.get();
    const response =
      await apiClient.get<ApiEnvelope<SiteSettings>>('/settings');
    return response.data.data;
  },

  /** PUT /settings/general (multipart) */
  async updateGeneral(
    input: Omit<GeneralSettings, 'logo_url' | 'favicon_url'>,
    files: GeneralFiles,
  ): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateGeneral(input, files);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/general',
      buildFormData({ ...input }, { ...files }),
    );
    return response.data.data;
  },

  /** PUT /settings/contact */
  async updateContact(input: ContactSettings): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateContact(input);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/contact',
      input,
    );
    return response.data.data;
  },

  /** PUT /settings/social */
  async updateSocial(input: SocialSettings): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateSocial(input);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/social',
      input,
    );
    return response.data.data;
  },

  /** PUT /settings/branding (multipart) */
  async updateBranding(
    input: Omit<
      BrandingSettings,
      'primary_logo_url' | 'footer_logo_url' | 'favicon_url'
    >,
    files: BrandingFiles,
  ): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateBranding(input, files);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/branding',
      buildFormData({ ...input }, { ...files }),
    );
    return response.data.data;
  },

  /** PUT /settings/seo (multipart) */
  async updateSeo(
    input: Omit<SeoSettings, 'og_image_url'>,
    files: SeoFiles,
  ): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateSeo(input, files);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/seo',
      buildFormData({ ...input }, { ...files }),
    );
    return response.data.data;
  },

  /** PUT /settings/email — display config only, never SMTP credentials. */
  async updateEmail(input: EmailSettings): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateEmail(input);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/email',
      input,
    );
    return response.data.data;
  },

  /** PUT /settings/controls */
  async updateControls(input: ControlsSettings): Promise<SiteSettings> {
    if (USE_MOCK) return mockSettingsDb.updateControls(input);
    const response = await apiClient.put<ApiEnvelope<SiteSettings>>(
      '/settings/controls',
      input,
    );
    return response.data.data;
  },
};
