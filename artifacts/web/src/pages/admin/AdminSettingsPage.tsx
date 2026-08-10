import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Globe,
  Image,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  ToggleLeft,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { getApiError } from '@/services/api';
import { useSiteSettings } from '@/hooks/useAdminSettings';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { GeneralSettingsSection } from '@/components/admin/settings/GeneralSettingsSection';
import { ContactSettingsSection } from '@/components/admin/settings/ContactSettingsSection';
import { SocialSettingsSection } from '@/components/admin/settings/SocialSettingsSection';
import { BrandingSettingsSection } from '@/components/admin/settings/BrandingSettingsSection';
import { SeoSettingsSection } from '@/components/admin/settings/SeoSettingsSection';
import { EmailSettingsSection } from '@/components/admin/settings/EmailSettingsSection';
import { ControlsSettingsSection } from '@/components/admin/settings/ControlsSettingsSection';

type SectionKey =
  | 'general'
  | 'contact'
  | 'social'
  | 'branding'
  | 'seo'
  | 'email'
  | 'controls';

const SECTIONS: Array<{ key: SectionKey; icon: LucideIcon }> = [
  { key: 'general', icon: Settings2 },
  { key: 'contact', icon: Phone },
  { key: 'social', icon: Share2 },
  { key: 'branding', icon: Image },
  { key: 'seo', icon: Search },
  { key: 'email', icon: Mail },
  { key: 'controls', icon: ToggleLeft },
];

/**
 * Website Settings — admin only. Desktop: sidebar navigation + content
 * panel; mobile: horizontally scrollable section tabs above stacked
 * content. Unsaved changes are guarded on section switches and page exit.
 */
export default function AdminSettingsPage() {
  const { t } = useLocale();
  const settingsQuery = useSiteSettings();

  const [active, setActive] = useState<SectionKey>('general');
  const [pendingSection, setPendingSection] = useState<SectionKey | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const [, forceRender] = useState(0);
  const [, navigate] = useLocation();

  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    forceRender((n) => n + 1);
  }, []);

  // Guard against losing unsaved changes on full page unload.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Guard in-app navigation (sidebar links, etc.) while a section is dirty:
  // intercept internal anchor clicks in the capture phase and confirm first.
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor = (event.target as HTMLElement).closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      if (href === '/admin/settings') return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  const requestSection = (key: SectionKey) => {
    if (key === active) return;
    if (dirtyRef.current) {
      setPendingSection(key);
      return;
    }
    setActive(key);
  };

  const confirmLeave = () => {
    dirtyRef.current = false;
    if (pendingHref) {
      const href = pendingHref;
      setPendingHref(null);
      setPendingSection(null);
      navigate(href);
      return;
    }
    if (pendingSection) {
      setActive(pendingSection);
      setPendingSection(null);
    }
  };

  const settings = settingsQuery.data;

  const sectionContent = settings ? (
    active === 'general' ? (
      <GeneralSettingsSection
        key={JSON.stringify(settings.general)}
        settings={settings.general}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'contact' ? (
      <ContactSettingsSection
        key={JSON.stringify(settings.contact)}
        settings={settings.contact}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'social' ? (
      <SocialSettingsSection
        key={JSON.stringify(settings.social)}
        settings={settings.social}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'branding' ? (
      <BrandingSettingsSection
        key={JSON.stringify(settings.branding)}
        settings={settings.branding}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'seo' ? (
      <SeoSettingsSection
        key={JSON.stringify(settings.seo)}
        settings={settings.seo}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'email' ? (
      <EmailSettingsSection
        key={JSON.stringify(settings.email)}
        settings={settings.email}
        onDirtyChange={handleDirtyChange}
      />
    ) : (
      <ControlsSettingsSection
        key={JSON.stringify(settings.controls)}
        settings={settings.controls}
        onDirtyChange={handleDirtyChange}
      />
    )
  ) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-settings-title"
          >
            {t('admin.settings.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.settings.subtitle')}
          </p>
        </div>

        {settingsQuery.isPending ? (
          <div className="grid gap-4 lg:grid-cols-4" data-testid="settings-loading">
            <Skeleton className="h-72 w-full lg:col-span-1" />
            <Skeleton className="h-96 w-full lg:col-span-3" />
          </div>
        ) : settingsQuery.isError ? (
          <Card>
            <CardContent
              className="flex flex-col items-center gap-3 p-10 text-center"
              data-testid="settings-error"
            >
              <p className="text-sm text-destructive">
                {getApiError(settingsQuery.error).message ||
                  t('admin.settings.loadError')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => settingsQuery.refetch()}
                data-testid="button-retry-settings"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.settings.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Mobile / tablet: horizontal scrollable tabs */}
            <div className="-mx-1 overflow-x-auto px-1 lg:hidden">
              <div className="flex w-max gap-2 pb-1">
                {SECTIONS.map(({ key, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={active === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => requestSection(key)}
                    data-testid={`tab-settings-${key}`}
                  >
                    <Icon className="me-1.5 h-4 w-4" />
                    {t(`admin.settings.sections.${key}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop: sidebar navigation */}
            <Card className="hidden h-fit lg:block">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {SECTIONS.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => requestSection(key)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm transition-colors',
                        active === key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted',
                      )}
                      data-testid={`nav-settings-${key}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(`admin.settings.sections.${key}`)}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">{sectionContent}</div>
          </div>
        )}
      </div>

      <GalleryConfirmDialog
        open={pendingSection !== null || pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSection(null);
            setPendingHref(null);
          }
        }}
        isPending={false}
        title={t('admin.settings.unsavedTitle')}
        description={t('admin.settings.unsavedDescription')}
        actionLabel={t('admin.settings.unsavedConfirm')}
        destructive
        testId="dialog-unsaved-changes"
        onConfirm={confirmLeave}
      />
    </AdminLayout>
  );
}
