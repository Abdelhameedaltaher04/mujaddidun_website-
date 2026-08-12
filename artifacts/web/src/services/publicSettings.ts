/**
 * Public website settings — sanitized Laravel endpoint:
 *   GET /public/settings   (no auth; email/SMTP section is never included)
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicGeneralSettings {
  site_name_ar: string;
  site_name_en: string;
  description_ar: string;
  description_en: string;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface PublicContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address_ar: string;
  address_en: string;
  maps_url: string;
  working_hours_ar?: string | null;
  working_hours_en?: string | null;
}

export interface PublicSocialLink {
  value: string | null;
  enabled: boolean;
}

export interface PublicBrandingSettings {
  primary_logo_url: string | null;
  footer_logo_url: string | null;
  favicon_url: string | null;
  website_title: string;
  default_language: 'ar' | 'en';
}

export interface PublicSeoSettings {
  meta_title_ar: string;
  meta_title_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  keywords: string;
  og_image_url: string | null;
}

export interface PublicControlSettings {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  allow_event_registrations: boolean;
  allow_volunteer_applications: boolean;
  show_donations: boolean;
  show_partners: boolean;
  show_faqs: boolean;
}

export interface PublicSettings {
  general: PublicGeneralSettings;
  contact: PublicContactSettings;
  social: Record<'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'whatsapp', PublicSocialLink>;
  branding: PublicBrandingSettings;
  seo: PublicSeoSettings;
  controls: PublicControlSettings;
}

export const publicSettingsApi = {
  /** GET /public/settings */
  async get(): Promise<PublicSettings> {
    const response =
      await apiClient.get<ApiEnvelope<PublicSettings>>('/public/settings');
    return response.data.data;
  },
};
