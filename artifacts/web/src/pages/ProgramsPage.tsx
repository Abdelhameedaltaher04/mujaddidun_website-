import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Users,
} from 'lucide-react';
import { Link } from 'wouter';
import { usePublicProgramsList } from '@/hooks/usePublicPrograms';
import type { PublicProgramCategory } from '@/services/publicPrograms';
import { getApiError } from '@/services/api';
import {
  programAudience,
  programDateRange,
  programExcerpt,
  programLocation,
  programTitle,
} from '@/lib/publicProgramsPresentation';

const CATEGORIES: (PublicProgramCategory | 'all')[] = [
  'all',
  'education',
  'health',
  'community',
  'environment',
  'youth',
  'relief',
];

export default function ProgramsPage() {
  const { t, dir, locale } = useLocale();
  const lang = locale as 'ar' | 'en';
  const [category, setCategory] = useState<PublicProgramCategory | 'all'>('all');
  const [page, setPage] = useState(1);

  const list = usePublicProgramsList({
    page,
    ...(category !== 'all' ? { category } : {}),
  });

  const programs = list.data?.data ?? [];
  const meta = list.data?.meta;

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const renderContent = () => {
    if (list.isPending) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" data-testid="programs-list-loading">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (list.isError) {
      const { status } = getApiError(list.error);
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="programs-list-error">
          <p className="text-muted-foreground mb-6">
            {status ? t('programs.loadError') : t('news.networkError')}
          </p>
          <Button onClick={() => list.refetch()} data-testid="button-programs-retry">
            {t('news.retry')}
          </Button>
        </div>
      );
    }

    if (programs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="programs-list-empty">
          <p className="text-muted-foreground">{t('programs.empty')}</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {programs.map((program) => {
          const dateRange = programDateRange(program, lang);
          const location = programLocation(program, lang);
          const audience = programAudience(program, lang);
          return (
            <div
              key={program.id}
              className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate transition-all overflow-hidden group"
              data-testid={`program-card-${program.id}`}
            >
              <Link href={`/programs/${program.id}`} className="block aspect-[16/9] bg-primary/5 relative overflow-hidden">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30 absolute inset-0 m-auto" />
                {program.image_url ? (
                  <img
                    src={program.image_url}
                    alt={programTitle(program, lang)}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </Link>
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full" data-testid={`text-program-category-${program.id}`}>
                    {t(`programs.categories.${program.category}`)}
                  </span>
                  {program.status === 'completed' ? (
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {t('programs.status.completed')}
                    </span>
                  ) : null}
                </div>
                <Link href={`/programs/${program.id}`}>
                  <h3 className="text-2xl font-bold font-display mb-3 text-foreground group-hover:text-primary transition-colors" data-testid={`text-program-title-${program.id}`}>
                    {programTitle(program, lang)}
                  </h3>
                </Link>
                <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-3 flex-1">
                  {programExcerpt(program, lang)}
                </p>
                <div className="space-y-2 border-t border-border pt-4 mt-auto text-sm text-muted-foreground">
                  {location ? (
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0 text-primary" /> {location}</div>
                  ) : null}
                  {dateRange ? (
                    <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 shrink-0 text-primary" /> {dateRange}</div>
                  ) : null}
                  {audience ? (
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 shrink-0 text-primary" /> {audience}</div>
                  ) : null}
                  {program.capacity !== null && program.participation_open ? (
                    <div className="flex items-center gap-2 font-medium text-primary" data-testid={`text-program-spots-${program.id}`}>
                      <Users className="w-4 h-4 shrink-0" /> {t('programs.spotsLeft').replace('{count}', String(program.available_spots ?? 0))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="px-6 pb-6 pt-2">
                <Button asChild className="w-full" variant="outline" data-testid={`link-program-details-${program.id}`}>
                  <Link href={`/programs/${program.id}`}>{t('common.readMore')}</Link>
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
        title={t('programs.title')} 
        description={t('programs.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' }, 
          { label: t('programs.title') }
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="flex flex-wrap justify-center gap-2 mb-12" role="group" aria-label={t('programs.aria.filterGroup')}>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                onClick={() => { setCategory(cat); setPage(1); }}
                aria-pressed={category === cat}
                className="rounded-full px-6"
                data-testid={`button-programs-filter-${cat}`}
              >
                {cat === 'all' ? t('programs.filter.all') : t(`programs.categories.${cat}`)}
              </Button>
            ))}
          </div>

          {renderContent()}

          {meta && meta.last_page > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-4" data-testid="programs-pagination">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="previous page"
                data-testid="button-programs-prev-page"
              >
                <PrevIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                {meta.current_page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= meta.last_page || list.isFetching}
                onClick={() => setPage((p) => p + 1)}
                aria-label="next page"
                data-testid="button-programs-next-page"
              >
                <NextIcon className="w-4 h-4" />
              </Button>
            </div>
          ) : null}
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
