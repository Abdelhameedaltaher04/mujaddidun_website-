import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

import { Heart, Home, GraduationCap } from 'lucide-react';

import { usePublicProgramsList } from '@/hooks/usePublicPrograms';
import { getApiError } from '@/services/api';
import { programExcerpt, programTitle } from '@/lib/publicProgramsPresentation';

/**
 * Decorative treatment for a card that has no image, keyed off the program's
 * own category so nothing about the project list is hardcoded. The icons and
 * tint classes are the three this page already used.
 *
 * Looked up loosely rather than as Record<PublicProgramCategory, ...>: the
 * seeded data contains an `empowerment` category that sits outside the union
 * the backend currently validates, so an exhaustive map would miss at runtime.
 */
const CATEGORY_STYLE: Record<string, { icon: typeof Heart; bgClass: string; textClass: string }> = {
  relief: { icon: Heart, bgClass: 'bg-primary/10', textClass: 'text-primary' },
  health: { icon: Heart, bgClass: 'bg-primary/10', textClass: 'text-primary' },
  community: { icon: Home, bgClass: 'bg-secondary/10', textClass: 'text-secondary' },
  environment: { icon: Home, bgClass: 'bg-secondary/10', textClass: 'text-secondary' },
  education: { icon: GraduationCap, bgClass: 'bg-info/10', textClass: 'text-info' },
  youth: { icon: GraduationCap, bgClass: 'bg-info/10', textClass: 'text-info' },
  empowerment: { icon: GraduationCap, bgClass: 'bg-info/10', textClass: 'text-info' },
};

const FALLBACK_STYLE = { icon: Heart, bgClass: 'bg-primary/10', textClass: 'text-primary' };

export default function ProjectsPage() {
  const { t, locale } = useLocale();
  const lang = locale as 'ar' | 'en';

  // 24 is the ceiling the backend applies to per_page; the page shows the whole
  // list in one grid, exactly as it did before, so no pagination UI is added.
  const list = usePublicProgramsList({ page: 1, per_page: 24 });
  const programs = list.data?.data ?? [];

  const renderContent = () => {
    if (list.isPending) {
      return (
        <div className="grid gap-8 md:grid-cols-3" data-testid="projects-list-loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (list.isError) {
      const { status } = getApiError(list.error);
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="projects-list-error">
          <p className="text-muted-foreground mb-6">
            {status ? t('programs.loadError') : t('news.networkError')}
          </p>
          <Button onClick={() => list.refetch()} data-testid="button-projects-retry">
            {t('news.retry')}
          </Button>
        </div>
      );
    }

    if (programs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="projects-list-empty">
          <p className="text-muted-foreground">{t('programs.empty')}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-8 md:grid-cols-3">
        {programs.map((program) => {
          const style = CATEGORY_STYLE[program.category] ?? FALLBACK_STYLE;
          const Icon = style.icon;
          const title = programTitle(program, lang);
          return (
            <div
              key={program.id}
              className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover-elevate transition-all group"
              data-testid={`project-card-${program.id}`}
            >
              <div className={cn('aspect-video relative flex items-center justify-center p-6', style.bgClass)}>
                <Icon className={cn('w-16 h-16 mb-2', style.textClass)} />
                {program.image_url ? (
                  <img
                    src={program.image_url}
                    alt={title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors" data-testid={`text-project-title-${program.id}`}>
                  {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                  {programExcerpt(program, lang)}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/donate?program=${program.id}`}>{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('projects.title')} 
        description={t('projects.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('projects.title') }]}
      />
      <main className="flex-1 py-8">
        <SectionWrapper>
          {renderContent()}
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
