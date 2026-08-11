import { Link } from 'wouter';
import {
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from 'react-icons/fa6';
import { MainContainer } from '@/components/layout/MainContainer';
import { useLocale } from '@/contexts/LocaleContext';
import { usePublicSettings, toWhatsAppNumber, safeExternalUrl } from '@/hooks/usePublicSettings';
import logoUrl from '@/assets/mujaddidun-logo.png';

const QUICK_LINKS = [
  { key: 'nav.about', href: '/about' },
  { key: 'nav.projects', href: '/projects' },
  { key: 'nav.programs', href: '/programs' },
  { key: 'nav.news', href: '/news' },
  { key: 'nav.events', href: '/events' },
  { key: 'nav.volunteer', href: '/volunteer' },
] as const;

const SOCIAL_ICONS = {
  facebook: { name: 'Facebook', icon: FaFacebookF },
  instagram: { name: 'Instagram', icon: FaInstagram },
  linkedin: { name: 'LinkedIn', icon: FaLinkedinIn },
  youtube: { name: 'YouTube', icon: FaYoutube },
  whatsapp: { name: 'WhatsApp', icon: FaWhatsapp },
} as const;

/** Fallback while settings load (matches the previous static footer). */
const DEFAULT_SOCIAL = ['facebook', 'instagram', 'whatsapp'] as const;

/**
 * Public site footer: logo, quick links, contact info,
 * social media placeholders, and copyright line.
 */
export function Footer() {
  const { t, locale } = useLocale();
  const settings = usePublicSettings();
  const year = new Date().getFullYear();

  const siteName =
    (locale === 'ar' ? settings?.general.site_name_ar : settings?.general.site_name_en) ||
    t('app.name');
  const footerLogo = settings?.branding.footer_logo_url || settings?.general.logo_url || logoUrl;

  const socialEntries = settings
    ? (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
        .filter((key) => settings.social[key]?.enabled && settings.social[key]?.value)
        .map((key) => {
          const raw = settings.social[key].value as string;
          const number = key === 'whatsapp' ? toWhatsAppNumber(raw) : null;
          const href = number ? `https://wa.me/${number}` : safeExternalUrl(raw);
          return href ? { key, href, external: true } : null;
        })
        .filter((entry): entry is { key: keyof typeof SOCIAL_ICONS; href: string; external: boolean } => entry !== null)
    : DEFAULT_SOCIAL.map((key) => ({ key, href: `#${key}`, external: false }));

  return (
    <footer className="border-t border-border bg-muted" data-testid="footer">
      <MainContainer width="wide" className="py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + brief */}
          <div>
            <img
              src={footerLogo}
              alt={siteName}
              className="h-16 w-auto"
              data-testid="img-footer-logo"
            />
            <p className="mt-4 text-sm font-semibold text-foreground">
              {siteName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(locale === 'ar'
                ? settings?.general.description_ar
                : settings?.general.description_en) || t('footer.aboutBrief')}
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label={t('footer.quickLinks')}>
            <h2 className="text-sm font-bold text-foreground">
              {t('footer.quickLinks')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="focus-ring-standard rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary"
                    data-testid={`link-footer-${link.key.split('.')[1]}`}
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact information */}
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {t('footer.contactInfo')}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {(locale === 'ar'
                    ? settings?.contact.address_ar
                    : settings?.contact.address_en) || t('footer.address')}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span dir="ltr">{settings?.contact.phone || t('footer.phone')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{settings?.contact.email || t('footer.email')}</span>
              </li>
            </ul>
          </div>

          {/* Social media placeholders */}
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {t('footer.followUs')}
            </h2>
            <div className="mt-4 flex items-center gap-3">
              {socialEntries.map(({ key, href, external }) => {
                const { name, icon: Icon } = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    aria-label={name}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground transition-all duration-300 cursor-pointer hover:scale-110 hover:text-primary hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 focus-ring-standard"
                    data-testid={`social-${key}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-border pt-6">
          <p
            className="text-center text-sm text-muted-foreground"
            data-testid="text-copyright"
          >
            {t('footer.copyright', { year })}
          </p>
        </div>
      </MainContainer>
    </footer>
  );
}
