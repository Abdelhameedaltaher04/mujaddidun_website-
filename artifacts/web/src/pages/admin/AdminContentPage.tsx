import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  BarChart3,
  Contact,
  Image,
  LayoutTemplate,
  Megaphone,
  PanelsTopLeft,
  PanelTop,
  RefreshCw,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { getApiError } from '@/services/api';
import { useWebsiteContent } from '@/hooks/useAdminContent';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { HeroContentSection } from '@/components/admin/content/HeroContentSection';
import { AboutContentSection } from '@/components/admin/content/AboutContentSection';
import { VisionMissionContentSection } from '@/components/admin/content/VisionMissionContentSection';
import { StatisticsContentSection } from '@/components/admin/content/StatisticsContentSection';
import { CtasContentSection } from '@/components/admin/content/CtasContentSection';
import { ContactContentSection } from '@/components/admin/content/ContactContentSection';
import { FooterContentSection } from '@/components/admin/content/FooterContentSection';
import { HomepageSectionsSection } from '@/components/admin/content/HomepageSectionsSection';

type TabKey =
  | 'hero'
  | 'about'
  | 'vision_mission'
  | 'statistics'
  | 'ctas'
  | 'contact'
  | 'footer'
  | 'homepageSections';

const TABS: Array<{ key: TabKey; icon: LucideIcon }> = [
  { key: 'hero', icon: LayoutTemplate },
  { key: 'about', icon: Image },
  { key: 'vision_mission', icon: Target },
  { key: 'statistics', icon: BarChart3 },
  { key: 'ctas', icon: Megaphone },
  { key: 'contact', icon: Contact },
  { key: 'footer', icon: PanelTop },
  { key: 'homepageSections', icon: PanelsTopLeft },
];

/**
 * Website Content — admin only. Mirrors the Settings page layout: desktop
 * sidebar navigation + content panel, mobile scrollable tabs. Unsaved
 * changes are guarded on tab switches and in-app navigation.
 */
export default function AdminContentPage() {
  const { t } = useLocale();
  const contentQuery = useWebsiteContent();

  const [active, setActive] = useState<TabKey>('hero');
  const [pendingTab, setPendingTab] = useState<TabKey | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const [, forceRender] = useState(0);
  const [, navigate] = useLocation();

  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    forceRender((n) => n + 1);
  }, []);

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
      if (href === '/admin/content') return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  const requestTab = (key: TabKey) => {
    if (key === active) return;
    if (dirtyRef.current) {
      setPendingTab(key);
      return;
    }
    setActive(key);
  };

  const confirmLeave = () => {
    dirtyRef.current = false;
    if (pendingHref) {
      const href = pendingHref;
      setPendingHref(null);
      setPendingTab(null);
      navigate(href);
      return;
    }
    if (pendingTab) {
      setActive(pendingTab);
      setPendingTab(null);
    }
  };

  const content = contentQuery.data;

  const tabContent = content ? (
    active === 'hero' ? (
      <HeroContentSection
        key={JSON.stringify(content.sections.hero)}
        content={content.sections.hero}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'about' ? (
      <AboutContentSection
        key={JSON.stringify(content.sections.about)}
        content={content.sections.about}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'vision_mission' ? (
      <VisionMissionContentSection
        key={JSON.stringify(content.sections.vision_mission)}
        content={content.sections.vision_mission}
        onDirtyChange={handleDirtyChange}
      />
    ) : active === 'statistics' ? (
      <StatisticsContentSection statistics={content.statistics} />
    ) : active === 'ctas' ? (
      <CtasContentSection ctas={content.ctas} />
    ) : active === 'contact' ? (
      <ContactContentSection onDirtyChange={handleDirtyChange} />
    ) : active === 'footer' ? (
      <FooterContentSection
        key={JSON.stringify(content.sections.footer)}
        content={content.sections.footer}
        onDirtyChange={handleDirtyChange}
      />
    ) : (
      <HomepageSectionsSection
        key={JSON.stringify(content.homepage_sections)}
        sections={content.homepage_sections}
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
            data-testid="text-content-title"
          >
            {t('admin.content.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.content.subtitle')}
          </p>
        </div>

        {contentQuery.isPending ? (
          <div className="grid gap-4 lg:grid-cols-4" data-testid="content-loading">
            <Skeleton className="h-72 w-full lg:col-span-1" />
            <Skeleton className="h-96 w-full lg:col-span-3" />
          </div>
        ) : contentQuery.isError ? (
          <Card>
            <CardContent
              className="flex flex-col items-center gap-3 p-10 text-center"
              data-testid="content-error"
            >
              <p className="text-sm text-destructive">
                {getApiError(contentQuery.error).message ||
                  t('admin.content.loadError')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => contentQuery.refetch()}
                data-testid="button-retry-content"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.content.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Mobile / tablet: horizontal scrollable tabs */}
            <div className="-mx-1 overflow-x-auto px-1 lg:hidden">
              <div className="flex w-max gap-2 pb-1">
                {TABS.map(({ key, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={active === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => requestTab(key)}
                    data-testid={`tab-content-${key}`}
                  >
                    <Icon className="me-1.5 h-4 w-4" />
                    {t(`admin.content.tabs.${key}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop: sidebar navigation */}
            <Card className="hidden h-fit lg:block">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {TABS.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => requestTab(key)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm transition-colors',
                        active === key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted',
                      )}
                      data-testid={`nav-content-${key}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(`admin.content.tabs.${key}`)}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">{tabContent}</div>
          </div>
        )}
      </div>

      <GalleryConfirmDialog
        open={pendingTab !== null || pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTab(null);
            setPendingHref(null);
          }
        }}
        isPending={false}
        title={t('admin.content.unsavedTitle')}
        description={t('admin.content.unsavedDescription')}
        actionLabel={t('admin.content.unsavedConfirm')}
        destructive
        testId="dialog-content-unsaved-changes"
        onConfirm={confirmLeave}
      />
    </AdminLayout>
  );
}
