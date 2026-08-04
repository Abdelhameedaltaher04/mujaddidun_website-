import { Link } from 'wouter';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import { MainContainer } from '@/components/layout/MainContainer';
import { useLocale } from '@/contexts/LocaleContext';

const QUICK_LINKS = [
  { key: 'nav.about', href: '/about' },
  { key: 'nav.projects', href: '/projects' },
  { key: 'nav.news', href: '/news' },
  { key: 'nav.events', href: '/events' },
  { key: 'nav.volunteer', href: '/volunteer' },
  { key: 'nav.contact', href: '/contact' },
] as const;

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: Facebook },
  { name: 'Twitter', icon: Twitter },
  { name: 'Instagram', icon: Instagram },
  { name: 'YouTube', icon: Youtube },
] as const;

/**
 * Public site footer: logo placeholder, quick links, contact info,
 * social media placeholders, and copyright line.
 */
export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted" data-testid="footer">
      <MainContainer width="wide" className="py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo placeholder + brief */}
          <div>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border bg-background text-center text-xs text-muted-foreground"
              data-testid="footer-logo-placeholder"
            >
              {t('footer.logoPlaceholder')}
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              {t('app.name')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('footer.aboutBrief')}
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label={t('footer.quickLinks')}>
            <h2 className="text-sm font-bold text-foreground">
              {t('footer.quickLinks')}
            </h2>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="focus-ring-standard rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span dir="ltr">{t('footer.phone')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t('footer.email')}</span>
              </li>
            </ul>
          </div>

          {/* Social media placeholders */}
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {t('footer.followUs')}
            </h2>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ name, icon: Icon }) => (
                <span
                  key={name}
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
                  data-testid={`social-${name.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              ))}
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
