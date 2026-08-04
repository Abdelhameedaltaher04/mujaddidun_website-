import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MainContainer } from '@/components/layout/MainContainer';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

/** Menu items: translation key + target path. */
const NAV_ITEMS = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.about', href: '/about' },
  { key: 'nav.projects', href: '/projects' },
  { key: 'nav.news', href: '/news' },
  { key: 'nav.events', href: '/events' },
  { key: 'nav.gallery', href: '/gallery' },
  { key: 'nav.reports', href: '/reports' },
  { key: 'nav.partners', href: '/partners' },
  { key: 'nav.faq', href: '/faq' },
  { key: 'nav.volunteer', href: '/volunteer' },
  { key: 'nav.contact', href: '/contact' },
] as const;

/**
 * Sticky, responsive top navigation. Desktop shows inline links;
 * mobile collapses into a toggleable menu. Fully bilingual (RTL/LTR)
 * via the locale context and logical properties.
 */
export function Navbar() {
  const { t } = useLocale();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? location === '/' : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <MainContainer width="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="focus-ring-standard rounded-md text-lg font-bold text-primary"
            data-testid="link-navbar-brand"
          >
            {t('app.name')}
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label={t('nav.mainNavigation')}
            className="hidden xl:flex items-center gap-1"
            data-testid="nav-desktop"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'focus-ring-standard rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                data-testid={`link-nav-${item.key.split('.')[1]}`}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button size="sm" className="hidden sm:inline-flex" data-testid="button-login">
              {t('nav.login')}
            </Button>
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              onClick={() => setMobileOpen((open) => !open)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </MainContainer>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label={t('nav.mainNavigation')}
          className="xl:hidden border-t border-border bg-background"
          data-testid="nav-mobile"
        >
          <MainContainer width="wide" className="py-3">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'focus-ring-standard block rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-muted text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    data-testid={`link-mobile-nav-${item.key.split('.')[1]}`}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li className="pt-2 sm:hidden">
                <Button className="w-full" data-testid="button-mobile-login">
                  {t('nav.login')}
                </Button>
              </li>
            </ul>
          </MainContainer>
        </nav>
      )}
    </header>
  );
}
