import logoUrl from '@/assets/mujaddidun-logo.png';
import type {
  BrandingFiles,
  BrandingSettings,
  ContactSettings,
  ControlsSettings,
  EmailSettings,
  GeneralFiles,
  GeneralSettings,
  SeoFiles,
  SeoSettings,
  SiteSettings,
  SocialSettings,
} from '@/services/adminSettings';

/**
 * In-memory mock of the Laravel Settings API, seeded with the current
 * live branding so saved defaults never break the existing design.
 * Uploaded files become session-only object URLs; Laravel will store
 * real files and return permanent URLs.
 */

const delay = (ms = 450) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const settings: SiteSettings = {
  general: {
    site_name_ar: 'منصة مجددون',
    site_name_en: 'Mujaddidun Platform',
    description_ar:
      'منصة مجددون التطوعية — مبادرات وبرامج مجتمعية تصنع أثراً مستداماً.',
    description_en:
      'Mujaddidun volunteer platform — community programs and initiatives creating lasting impact.',
    logo_url: logoUrl,
    favicon_url: null,
  },
  contact: {
    phone: '+96265001122',
    whatsapp: '+962790001122',
    email: 'info@mujaddidun.org',
    address_ar: 'عمّان، الأردن — شارع المدينة المنورة، مبنى 12',
    address_en: 'Amman, Jordan — Al Madinah Al Munawarah St., Building 12',
    maps_url: 'https://maps.google.com/?q=Amman+Jordan',
  },
  social: {
    facebook: { value: 'https://facebook.com/mujaddidun', enabled: true },
    instagram: { value: 'https://instagram.com/mujaddidun', enabled: true },
    linkedin: {
      value: 'https://linkedin.com/company/mujaddidun',
      enabled: false,
    },
    youtube: { value: '', enabled: false },
    whatsapp: { value: '+962790001122', enabled: true },
  },
  branding: {
    primary_logo_url: logoUrl,
    footer_logo_url: logoUrl,
    favicon_url: null,
    website_title: 'Mujaddidun | مجددون',
    default_language: 'ar',
  },
  seo: {
    meta_title_ar: 'منصة مجددون — مبادرات تطوعية وبرامج مجتمعية',
    meta_title_en: 'Mujaddidun — Volunteer Programs & Community Impact',
    meta_description_ar:
      'انضم إلى منصة مجددون: برامج تطوعية، فعاليات مجتمعية، وفرص للعطاء تصنع أثراً حقيقياً.',
    meta_description_en:
      'Join Mujaddidun: volunteer programs, community events, and giving opportunities that create real impact.',
    keywords: 'تطوع, مجددون, مبادرات, volunteer, community, Jordan',
    og_image_url: null,
  },
  email: {
    sender_name: 'Mujaddidun Platform',
    sender_email: 'no-reply@mujaddidun.org',
    reply_to_email: 'info@mujaddidun.org',
  },
  controls: {
    maintenance_mode: false,
    allow_registrations: true,
    allow_event_registrations: true,
    allow_volunteer_applications: true,
    show_donations: true,
    show_partners: true,
    show_faqs: true,
  },
};

const clone = (): SiteSettings => JSON.parse(JSON.stringify(settings));

/** Object URLs created by this mock, revoked when superseded/removed. */
const ownedUrls = new Set<string>();

function releaseIfOwned(url: string | null) {
  if (url && ownedUrls.has(url)) {
    URL.revokeObjectURL(url);
    ownedUrls.delete(url);
  }
}

function resolveImage(
  current: string | null,
  file: File | null | undefined,
  remove: boolean | undefined,
): string | null {
  if (file) {
    releaseIfOwned(current);
    const url = URL.createObjectURL(file);
    ownedUrls.add(url);
    return url;
  }
  if (remove) {
    releaseIfOwned(current);
    return null;
  }
  return current;
}

export const mockSettingsDb = {
  async get(): Promise<SiteSettings> {
    await delay(350);
    return clone();
  },

  async updateGeneral(
    input: Omit<GeneralSettings, 'logo_url' | 'favicon_url'>,
    files: GeneralFiles,
  ): Promise<SiteSettings> {
    await delay();
    settings.general = {
      ...input,
      logo_url: resolveImage(
        settings.general.logo_url,
        files.logo,
        files.remove_logo,
      ),
      favicon_url: resolveImage(
        settings.general.favicon_url,
        files.favicon,
        files.remove_favicon,
      ),
    };
    return clone();
  },

  async updateContact(input: ContactSettings): Promise<SiteSettings> {
    await delay();
    settings.contact = { ...input };
    return clone();
  },

  async updateSocial(input: SocialSettings): Promise<SiteSettings> {
    await delay();
    settings.social = JSON.parse(JSON.stringify(input));
    return clone();
  },

  async updateBranding(
    input: Omit<
      BrandingSettings,
      'primary_logo_url' | 'footer_logo_url' | 'favicon_url'
    >,
    files: BrandingFiles,
  ): Promise<SiteSettings> {
    await delay();
    settings.branding = {
      ...input,
      primary_logo_url: resolveImage(
        settings.branding.primary_logo_url,
        files.primary_logo,
        files.remove_primary_logo,
      ),
      footer_logo_url: resolveImage(
        settings.branding.footer_logo_url,
        files.footer_logo,
        files.remove_footer_logo,
      ),
      favicon_url: resolveImage(
        settings.branding.favicon_url,
        files.favicon,
        files.remove_favicon,
      ),
    };
    return clone();
  },

  async updateSeo(
    input: Omit<SeoSettings, 'og_image_url'>,
    files: SeoFiles,
  ): Promise<SiteSettings> {
    await delay();
    settings.seo = {
      ...input,
      og_image_url: resolveImage(
        settings.seo.og_image_url,
        files.og_image,
        files.remove_og_image,
      ),
    };
    return clone();
  },

  async updateEmail(input: EmailSettings): Promise<SiteSettings> {
    await delay();
    settings.email = { ...input };
    return clone();
  },

  async updateControls(input: ControlsSettings): Promise<SiteSettings> {
    await delay();
    settings.controls = { ...input };
    return clone();
  },
};
