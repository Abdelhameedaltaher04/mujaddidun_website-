import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { GalleryLightbox } from '@/components/layout/GalleryLightbox';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { usePublicAlbum, usePublicAlbumImages } from '@/hooks/usePublicGallery';
import { getApiError } from '@/services/api';
import { applySeoMeta } from '@/lib/seo';
import { albumDescription, albumTitle, imageAlt, imageCaption } from '@/lib/publicGalleryPresentation';

export default function GalleryAlbumPage() {
  const { t, dir, locale } = useLocale();
  const lang = locale as 'ar' | 'en';
  const params = useParams<{ id: string }>();
  const id = params.id;
  const validId = !!id && /^\d+$/.test(id);

  const [page, setPage] = useState(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const album = usePublicAlbum(validId ? id : undefined);
  const images = usePublicAlbumImages(validId ? id : undefined, page, !album.isError);

  const albumStatus = album.isError ? getApiError(album.error).status : undefined;
  const notFound = !validId || albumStatus === 404;

  const title = album.data ? albumTitle(album.data, lang) : '';
  const description = album.data ? albumDescription(album.data, lang) : '';

  // SEO from real album data.
  useEffect(() => {
    if (!album.data) return;
    return applySeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: album.data.cover_image_url
        ? new URL(album.data.cover_image_url, window.location.origin).href
        : null,
    });
  }, [album.data, title, description]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const imageList = images.data?.data ?? [];
  const meta = images.data?.meta;

  // Clamp out-of-range pages (e.g. images removed while browsing) back to the last valid page.
  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  const backButton = (
    <Button variant="outline" size="lg" asChild>
      <Link href="/gallery">
        <BackIcon className="w-5 h-5 me-2" />
        {t('gallery.backToGallery')}
      </Link>
    </Button>
  );

  if (notFound || album.isError) {
    const message = notFound
      ? t('gallery.notFound')
      : albumStatus
        ? t('gallery.loadError')
        : t('news.networkError');
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader
          title={t('gallery.title')}
          breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('gallery.title'), href: '/gallery' }]}
        />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center" data-testid={notFound ? 'album-not-found' : 'album-error'}>
          <SectionHeading title={message} accent="primary" />
          <div className="flex items-center gap-3 mt-8">
            {!notFound ? (
              <Button size="lg" onClick={() => album.refetch()} data-testid="button-album-retry">
                {t('news.retry')}
              </Button>
            ) : null}
            {backButton}
          </div>
        </main>
        <ContactCtaSection />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={album.data ? title : t('gallery.title')}
        description={album.data ? description : undefined}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('gallery.title'), href: '/gallery' },
          ...(album.data ? [{ label: title }] : []),
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          {album.isPending || images.isPending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="album-images-loading">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : images.isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="album-images-error">
              <p className="text-muted-foreground mb-6">
                {getApiError(images.error).status ? t('gallery.loadError') : t('news.networkError')}
              </p>
              <Button onClick={() => images.refetch()} data-testid="button-album-images-retry">
                {t('news.retry')}
              </Button>
            </div>
          ) : imageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="album-images-empty">
              <p className="text-muted-foreground">{t('gallery.noImages')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {imageList.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => setOpenIndex(index)}
                    aria-label={imageAlt(image, lang) || title}
                    className="group rounded-2xl overflow-hidden shadow-sm hover-elevate transition-all border border-border flex flex-col bg-card text-start cursor-pointer focus-ring-standard"
                    data-testid={`album-image-${image.id}`}
                  >
                    <div className="aspect-[4/3] bg-muted relative w-full overflow-hidden">
                      <div className="flex items-center justify-center h-full text-muted-foreground/30">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                      <img
                        src={image.url}
                        alt={imageAlt(image, lang)}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors z-10"></div>
                    </div>
                    {imageCaption(image, lang) ? (
                      <div className="p-3 border-t border-border w-full">
                        <p className="text-sm text-muted-foreground text-center line-clamp-2">
                          {imageCaption(image, lang)}
                        </p>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>

              {meta && meta.last_page > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-4" data-testid="album-images-pagination">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1 || images.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label={t('gallery.aria.prevPage')}
                    data-testid="button-album-prev-page"
                  >
                    <PrevIcon className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    {meta.current_page} / {meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= meta.last_page || images.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label={t('gallery.aria.nextPage')}
                    data-testid="button-album-next-page"
                  >
                    <NextIcon className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
            </>
          )}

          <div className="flex justify-center mt-12 pt-8 border-t border-border">
            {backButton}
          </div>
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
      <GalleryLightbox
        openIndex={openIndex}
        count={imageList.length}
        onNavigate={setOpenIndex}
        onClose={() => setOpenIndex(null)}
        getLabel={(index) => {
          const image = imageList[index];
          return image ? (imageCaption(image, lang) || imageAlt(image, lang) || title) : title;
        }}
        renderItem={(index) => {
          const image = imageList[index];
          if (!image) return null;
          return (
            <img
              src={image.url}
              alt={imageAlt(image, lang)}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain mx-auto"
            />
          );
        }}
      />
    </div>
  );
}
