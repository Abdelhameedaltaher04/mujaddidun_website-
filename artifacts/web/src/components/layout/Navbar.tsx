import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MainContainer } from '@/components/layout/MainContainer';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/mujaddidun-logo.png';

interface NavLinkItem {
  kind: 'link';
  key: string;
  href: string;
}

interface NavGroupItem {
  kind: 'group';
  key: string;
  children: { key: string; href: string }[];
}

type NavItem = NavLinkItem | NavGroupItem;

/**
 * Simplified navigation structure: top-level links plus grouped dropdowns.
 * Partners and FAQ pages still exist but are intentionally not linked here.
 */
const NAV_STRUCTURE: NavItem[] = [
  { kind: 'link', key: 'nav.home', href: '/' },
  { kind: 'link', key: 'nav.about', href: '/about' },
  {
    kind: 'group',
    key: 'nav.activities',
    children: [
      { key: 'nav.programs', href: '/programs' },
      { key: 'nav.projects', href: '/projects' },
      { key: 'nav.events', href: '/events' },
      { key: 'nav.gallery', href: '/gallery' },
    ],
  },
  {
    kind: 'group',
    key: 'nav.media',
    children: [{ key: 'nav.news', href: '/news' }],
  },
  { kind: 'link', key: 'nav.volunteer', href: '/volunteer' },
  { kind: 'link', key: 'nav.contact', href: '/contact' },
];

const keySlug = (key: string) => key.split('.')[1];

/**
 * Sticky, responsive top navigation. Desktop shows inline links with
 * hover dropdowns; mobile uses a full-screen overlay menu. Fully
 * bilingual (RTL/LTR) via the locale context and logical properties.
 */
export function Navbar() {
  const { t } = useLocale();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string) =>
    href === '/' ? location === '/' : location.startsWith(href);

  const isGroupActive = (group: NavGroupItem) =>
    group.children.some((c) => isActive(c.href));

  // Close menus with ESC; lock body scroll while the mobile overlay is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const openWithHover = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(key);
  };

  const closeWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenMobileGroup(null);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <MainContainer width="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="focus-ring-standard flex items-center gap-2 rounded-md text-lg font-bold text-primary"
            data-testid="link-navbar-brand"
          >
            <img
              src={logoUrl}
              alt=""
              className="h-10 w-auto shrink-0"
              data-testid="img-navbar-logo"
            />
            <span className="sr-only">{t('app.name')}</span>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label={t('nav.mainNavigation')}
            className="hidden lg:flex items-center gap-1"
            data-testid="nav-desktop"
          >
            {NAV_STRUCTURE.map((item) =>
              item.kind === 'link' ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'focus-ring-standard rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  data-testid={`link-nav-${keySlug(item.key)}`}
                >
                  {t(item.key)}
                </Link>
              ) : (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => openWithHover(item.key)}
                  onMouseLeave={closeWithDelay}
                >
                  <button
                    type="button"
                    aria-expanded={openDropdown === item.key}
                    aria-haspopup="true"
                    onClick={() =>
                      setOpenDropdown((cur) => (cur === item.key ? null : item.key))
                    }
                    className={cn(
                      'focus-ring-standard flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isGroupActive(item) || openDropdown === item.key
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    data-testid={`button-nav-${keySlug(item.key)}`}
                  >
                    {t(item.key)}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        openDropdown === item.key && 'rotate-180',
                      )}
                    />
                  </button>
                  {openDropdown === item.key && (
                    <div
                      className="absolute top-full start-0 pt-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200"
                      data-testid={`dropdown-nav-${keySlug(item.key)}`}
                    >
                      <div className="min-w-[200px] rounded-xl border border-border bg-popover p-2 shadow-lg">
                        {item.children.map((child) => (
                          <Link
                            key={child.key}
                            href={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className={cn(
                              'focus-ring-standard block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                              isActive(child.href)
                                ? 'bg-muted text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                            data-testid={`link-nav-${keySlug(child.key)}`}
                          >
                            {t(child.key)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              data-testid="button-login"
              asChild
            >
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="hidden sm:inline-flex"
              data-testid="button-donate"
              asChild
            >
              <Link href="/donate">{t('nav.donate')}</Link>
            </Button>
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              onClick={() => setMobileOpen((open) => !open)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </MainContainer>

      {/* Full-screen mobile navigation overlay */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mainNavigation')}
          className="fixed inset-0 z-[60] lg:hidden flex flex-col bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-300"
          data-testid="nav-mobile"
        >
          {/* Subtle brand accents */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
            <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
          </div>

          {/* Overlay header */}
          <div className="relative flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border/60">
            <Link href="/" onClick={closeMobile} className="focus-ring-standard rounded-md">
              <img src={logoUrl} alt="" className="h-10 w-auto" />
              <span className="sr-only">{t('app.name')}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('nav.closeMenu')}
              onClick={closeMobile}
              data-testid="button-mobile-close"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Centered links */}
          <nav
            aria-label={t('nav.mainNavigation')}
            className="relative flex-1 overflow-y-auto flex flex-col items-center justify-center gap-1 px-6 py-8"
          >
            {NAV_STRUCTURE.map((item) =>
              item.kind === 'link' ? (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    'focus-ring-standard rounded-lg px-4 py-2.5 text-2xl font-bold font-display transition-colors',
                    isActive(item.href)
                      ? 'text-secondary'
                      : 'text-foreground hover:text-secondary',
                  )}
                  data-testid={`link-mobile-nav-${keySlug(item.key)}`}
                >
                  {t(item.key)}
                </Link>
              ) : (
                <div key={item.key} className="flex flex-col items-center">
                  <button
                    type="button"
                    aria-expanded={openMobileGroup === item.key}
                    onClick={() =>
                      setOpenMobileGroup((cur) => (cur === item.key ? null : item.key))
                    }
                    className={cn(
                      'focus-ring-standard flex items-center gap-2 rounded-lg px-4 py-2.5 text-2xl font-bold font-display transition-colors',
                      isGroupActive(item) || openMobileGroup === item.key
                        ? 'text-secondary'
                        : 'text-foreground hover:text-secondary',
                    )}
                    data-testid={`button-mobile-nav-${keySlug(item.key)}`}
                  >
                    {t(item.key)}
                    <ChevronDown
                      className={cn(
                        'h-6 w-6 transition-transform duration-200',
                        openMobileGroup === item.key && 'rotate-180',
                      )}
                    />
                  </button>
                  {openMobileGroup === item.key && (
                    <div className="flex flex-col items-center gap-0.5 pb-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200">
                      {item.children.map((child) => (
                        <Link
                          key={child.key}
                          href={child.href}
                          onClick={closeMobile}
                          className={cn(
                            'focus-ring-standard rounded-lg px-4 py-1.5 text-lg font-medium transition-colors',
                            isActive(child.href)
                              ? 'text-secondary'
                              : 'text-muted-foreground hover:text-secondary',
                          )}
                          data-testid={`link-mobile-nav-${keySlug(child.key)}`}
                        >
                          {t(child.key)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </nav>

          {/* Overlay footer actions */}
          <div className="relative px-6 pb-8 pt-2 flex flex-col gap-2 max-w-sm w-full mx-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              data-testid="button-mobile-donate"
              asChild
            >
              <Link href="/donate" onClick={closeMobile}>
                {t('nav.donate')}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              data-testid="button-mobile-login"
              asChild
            >
              <Link href="/login" onClick={closeMobile}>
                {t('nav.login')}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
