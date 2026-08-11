import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Link } from 'wouter';
import { useState } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicNewsList } from '@/hooks/usePublicNews';
import { getApiError } from '@/services/api';
import {
  newsCategoryKey,
  newsDate,
  newsExcerpt,
  newsTitle,
} from '@/lib/publicNewsPresentation';

export default function NewsPage() {
  const { t, locale, dir } = useLocale();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = usePublicNewsList(page);

  const errorMessage = isError
    ? getApiError(error).status
      ? t('news.loadError')
      : t('news.networkError')
    : null;

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('news.title')} 
        description={t('news.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('news.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          {isPending ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="news-list-loading">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <Skeleton className="aspect-[16/9] rounded-none" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="news-list-error">
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <Button onClick={() => refetch()} data-testid="button-news-retry">
                {t('news.retry')}
              </Button>
            </div>
          ) : data && data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="news-list-empty">
              <p className="text-muted-foreground">{t('news.empty')}</p>
            </div>
          ) : data ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.map((item) => {
                  const categoryKey = newsCategoryKey(item.category);
                  return (
                    <Link key={item.id} href={`/news/${item.id}`} className="flex flex-col rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group focus-ring-standard overflow-hidden" data-testid={`news-card-${item.id}`}>
                      <div className="aspect-[16/9] bg-muted relative overflow-hidden flex items-center justify-center">
                        {item.featured_image_url ? (
                          <img
                            src={item.featured_image_url}
                            alt={newsTitle(item, locale as 'ar' | 'en')}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                        {categoryKey ? (
                          <div className="absolute top-4 start-4 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary border border-border shadow-sm">
                            {t(categoryKey)}
                          </div>
                        ) : null}
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                      </div>
                      <div className="flex flex-col justify-center p-6 flex-1">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">{newsDate(item, locale as 'ar' | 'en')}</div>
                        <h3 className="font-bold font-display text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">{newsTitle(item, locale as 'ar' | 'en')}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">{newsExcerpt(item, locale as 'ar' | 'en')}</p>
                        <div className="text-primary font-bold text-sm mt-auto">{t('common.readMore')}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {data.meta.last_page > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-4" data-testid="news-pagination">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    aria-label="previous page"
                    data-testid="button-news-prev-page"
                  >
                    <PrevIcon className="w-5 h-5" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    {data.meta.current_page} / {data.meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= data.meta.last_page}
                    onClick={() => setPage((current) => current + 1)}
                    aria-label="next page"
                    data-testid="button-news-next-page"
                  >
                    <NextIcon className="w-5 h-5" />
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
