import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Images } from 'lucide-react';
import { Link } from 'wouter';
import { usePublicAlbumsList } from '@/hooks/usePublicGallery';
import { getApiError } from '@/services/api';
import { albumDescription, albumTitle } from '@/lib/publicGalleryPresentation';

export default function GalleryPage() {
  const { t, dir, locale } = useLocale();
  const lang = locale as 'ar' | 'en';
  const [page, setPage] = useState(1);

  const list = usePublicAlbumsList(page);
  const albums = list.data?.data ?? [];
  const meta = list.data?.meta;

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  // Clamp out-of-range pages (e.g. content removed while browsing) back to the last valid page.
  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  const renderContent = () => {
    if (list.isPending) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="gallery-list-loading">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (list.isError) {
      const { status } = getApiError(list.error);
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="gallery-list-error">
          <p className="text-muted-foreground mb-6">
            {status ? t('gallery.loadError') : t('news.networkError')}
          </p>
          <Button onClick={() => list.refetch()} data-testid="button-gallery-retry">
            {t('news.retry')}
          </Button>
        </div>
      );
    }

    if (albums.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="gallery-list-empty">
          <p className="text-muted-foreground">{t('gallery.empty')}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/gallery/${album.id}`}
            className="group rounded-2xl overflow-hidden shadow-sm hover-elevate transition-all border border-border flex flex-col bg-card text-start cursor-pointer focus-ring-standard"
            data-testid={`album-card-${album.id}`}
          >
            <div className="aspect-[4/3] bg-muted relative w-full overflow-hidden">
              <div className="flex items-center justify-center h-full text-muted-foreground/30">
                <ImageIcon className="w-12 h-12" />
              </div>
              {album.cover_image_url ? (
                <img
                  src={album.cover_image_url}
                  alt={albumTitle(album, lang)}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors z-10"></div>
              <span className="absolute bottom-2 end-2 z-10 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/60 px-2.5 py-1 rounded-full" data-testid={`text-album-count-${album.id}`}>
                <Images className="w-3.5 h-3.5" />
                {album.images_count}
              </span>
            </div>
            <div className="p-4 border-t border-border w-full">
              <h3 className="font-semibold text-center text-foreground group-hover:text-primary transition-colors" data-testid={`text-album-title-${album.id}`}>
                {albumTitle(album, lang)}
              </h3>
              {albumDescription(album, lang) ? (
                <p className="text-sm text-muted-foreground text-center mt-1 line-clamp-2">
                  {albumDescription(album, lang)}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('gallery.title')} 
        description={t('gallery.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('gallery.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          {renderContent()}

          {meta && meta.last_page > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-4" data-testid="gallery-pagination">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label={t('gallery.aria.prevPage')}
                data-testid="button-gallery-prev-page"
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
                aria-label={t('gallery.aria.nextPage')}
                data-testid="button-gallery-next-page"
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
