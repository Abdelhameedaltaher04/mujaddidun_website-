import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLocale } from '@/contexts/LocaleContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { applySeoMeta } from '@/lib/seo';

/**
 * Applies sitewide SEO defaults (title, description, OG tags, favicon)
 * from the admin-managed public settings.
 *
 * Skipped on routes that own their SEO (news details) and on the admin
 * area, so page-level `applySeoMeta` calls are never stomped.
 */
export function SiteSeoDefaults() {
  const settings = usePublicSettings();
  const { locale } = useLocale();
  const [location] = useLocation();

  const ownsOwnSeo = /^\/news\/\d+/.test(location) || location.startsWith('/admin');

  useEffect(() => {
    if (!settings || ownsOwnSeo) return;

    const seo = settings.seo;
    const isAr = locale === 'ar';
    const siteName = isAr ? settings.general.site_name_ar : settings.general.site_name_en;
    const title =
      (isAr ? seo.meta_title_ar : seo.meta_title_en) ||
      settings.branding.website_title ||
      siteName;
    const description =
      (isAr ? seo.meta_description_ar : seo.meta_description_en) ||
      (isAr ? settings.general.description_ar : settings.general.description_en);

    if (!title) return;

    const restore = applySeoMeta({
      title,
      description: description || undefined,
      ogTitle: title || undefined,
      ogDescription: description || undefined,
      ogImage: seo.og_image_url
        ? new URL(seo.og_image_url, window.location.origin).toString()
        : undefined,
    });
    return restore;
  }, [settings, locale, ownsOwnSeo]);

  // Favicon from settings (applied once per change; not restored).
  useEffect(() => {
    const favicon = settings?.branding.favicon_url || settings?.general.favicon_url;
    if (!favicon) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = favicon;
  }, [settings]);

  return null;
}
