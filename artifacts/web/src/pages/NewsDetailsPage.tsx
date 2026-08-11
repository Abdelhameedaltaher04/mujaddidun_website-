import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from 'wouter';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, User, Image as ImageIcon } from 'lucide-react';
import { FaFacebookF, FaWhatsapp } from 'react-icons/fa6';
import { GalleryLightbox } from '@/components/layout/GalleryLightbox';
import { usePublicNewsArticle } from '@/hooks/usePublicNews';
import { getApiError } from '@/services/api';
import { applySeoMeta } from '@/lib/seo';
import {
  newsCategoryKey,
  newsDate,
  newsExcerpt,
  newsParagraphs,
  newsTitle,
} from '@/lib/publicNewsPresentation';

export default function NewsDetailsPage() {
  const { t, dir, locale } = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;
  // Lightbox index over [featured image?, ...gallery images]; null = closed.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const validId = !!id && /^\d+$/.test(id);
  const { data: article, isPending, isError, error, refetch } =
    usePublicNewsArticle(validId ? id : undefined);

  const status = isError ? getApiError(error).status : undefined;
  const notFound = !validId || status === 404;
  const lang = locale as 'ar' | 'en';

  const title = article ? newsTitle(article, lang) : '';
  const excerpt = article ? newsExcerpt(article, lang) : '';

  // SEO: reflect the loaded article in title/description/OG tags.
  useEffect(() => {
    if (!article) return;
    const description = excerpt || newsParagraphs(lang === 'ar' ? article.content_ar : article.content_en)[0] || '';
    return applySeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: article.featured_image_url
        ? new URL(article.featured_image_url, window.location.origin).href
        : null,
    });
  }, [article, title, excerpt, lang]);

  const backButton = (
    <Button size="lg" className="mt-8" asChild>
      <Link href="/news">
        {dir === 'rtl' ? <ArrowRight className="w-5 h-5 me-2" /> : <ArrowLeft className="w-5 h-5 me-2" />}
        {t('news.backToNews')}
      </Link>
    </Button>
  );

  if (notFound || (isError && !notFound)) {
    const message = notFound
      ? t('news.notFound')
      : status
        ? t('news.loadError')
        : t('news.networkError');
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader 
          title={t('news.title')}
          breadcrumbs={[
            { label: t('nav.home'), href: '/' },
            { label: t('news.title'), href: '/news' }
          ]}
        />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center" data-testid={notFound ? 'news-details-not-found' : 'news-details-error'}>
          <SectionHeading title={message} description={notFound ? t('news.empty') : ''} accent="primary" />
          {!notFound ? (
            <Button size="lg" className="mt-8" onClick={() => refetch()} data-testid="button-news-details-retry">
              {t('news.retry')}
            </Button>
          ) : null}
          {backButton}
        </main>
        <ContactCtaSection />
        <Footer />
      </div>
    );
  }

  if (isPending || !article) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader 
          title={t('news.title')}
          breadcrumbs={[
            { label: t('nav.home'), href: '/' },
            { label: t('news.title'), href: '/news' }
          ]}
        />
        <main className="flex-1">
          <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
            <div className="max-w-4xl mx-auto" data-testid="news-details-loading">
              <div className="mb-10 flex flex-col items-center gap-6">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="w-full aspect-[2/1] rounded-3xl mb-12" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          </SectionWrapper>
        </main>
        <ContactCtaSection />
        <Footer />
      </div>
    );
  }

  // Lightbox items: featured image first (if any), then gallery images.
  const lightboxItems: { src: string; alt: string }[] = [
    ...(article.featured_image_url ? [{ src: article.featured_image_url, alt: title }] : []),
    ...article.gallery_images.map((image) => ({
      src: image.image,
      alt: (lang === 'ar' ? image.alt_text_ar : image.alt_text_en) || title,
    })),
  ];
  const galleryOffset = article.featured_image_url ? 1 : 0;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const categoryKey = newsCategoryKey(article.category);
  const paragraphs = newsParagraphs(lang === 'ar' ? article.content_ar : article.content_en);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <PageHeader 
        title={t('news.title')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('news.title'), href: '/news' },
          { label: title }
        ]}
      />

      <main className="flex-1">
        <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
          <article className="max-w-4xl mx-auto">
            {/* Header / Meta */}
            <div className="mb-10 text-center">
              {categoryKey ? (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-sm rounded-full mb-6">
                  {t(categoryKey)}
                </span>
              ) : null}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6 leading-tight text-balance" data-testid="text-article-title">
                {title}
              </h1>
              <div className="flex items-center justify-center text-muted-foreground gap-2 font-medium flex-wrap">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{newsDate(article, lang)}</span>
                {article.author ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    <User className="w-5 h-5 text-primary" />
                    <span data-testid="text-article-author">{article.author}</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Featured Image */}
            {article.featured_image_url ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label={title}
                className="w-full aspect-[2/1] rounded-3xl bg-muted border border-border flex items-center justify-center mb-12 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 focus-ring-standard relative"
                data-testid="button-article-featured-image"
              >
                <ImageIcon className="w-16 h-16 text-muted-foreground/40 opacity-50" />
                <img
                  src={article.featured_image_url}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </button>
            ) : null}

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-6 text-foreground/90 leading-relaxed mb-12" data-testid="text-article-content">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Gallery images (hidden entirely when the article has none) */}
            {article.gallery_images.length > 0 ? (
              <div className="mb-12" data-testid="article-gallery">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                  {t('news.galleryHeading')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {article.gallery_images.map((image, index) => {
                    const alt = (lang === 'ar' ? image.alt_text_ar : image.alt_text_en) || title;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setLightboxIndex(galleryOffset + index)}
                        aria-label={alt}
                        className="aspect-[4/3] rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 focus-ring-standard relative"
                        data-testid={`button-gallery-image-${image.id}`}
                      >
                        <ImageIcon className="w-10 h-10 text-muted-foreground/40 opacity-50" />
                        <img
                          src={image.image}
                          alt={alt}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Share & Back */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-b border-border">
              <div className="flex items-center gap-4">
                <span className="font-bold text-foreground">{t('news.share')}:</span>
                <div className="flex gap-2">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all focus-ring-standard">
                    <FaFacebookF className="w-4 h-4" />
                  </a>
                  <a href={`https://wa.me/?text=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-success hover:border-success hover:scale-110 hover:shadow-lg hover:shadow-success/20 transition-all focus-ring-standard">
                    <FaWhatsapp className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <Button variant="outline" size="lg" asChild>
                <Link href="/news">
                  {dir === 'rtl' ? <ArrowRight className="w-5 h-5 me-2" /> : <ArrowLeft className="w-5 h-5 me-2" />}
                  {t('news.backToNews')}
                </Link>
              </Button>
            </div>
          </article>
        </SectionWrapper>

        {/* Related News */}
        {article.related.length > 0 ? (
          <SectionWrapper variant="muted" className="border-t border-border">
            <SectionHeading title={t('news.related')} accent="secondary" align="start" className="mb-10" />
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto md:mx-0">
              {article.related.map((related) => {
                const relatedCategoryKey = newsCategoryKey(related.category);
                return (
                  <div key={related.id} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate-2 transition-all overflow-hidden group" data-testid={`related-news-${related.id}`}>
                    <div className="aspect-[16/9] bg-muted relative flex items-center justify-center overflow-hidden">
                      {related.featured_image_url ? (
                        <img
                          src={related.featured_image_url}
                          alt={newsTitle(related, lang)}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                      {relatedCategoryKey ? (
                        <div className="absolute top-4 start-4 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary border border-border shadow-sm">
                          {t(relatedCategoryKey)}
                        </div>
                      ) : null}
                    </div>
                    <div className="p-6 md:p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{newsDate(related, lang)}</span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-foreground mb-4 group-hover:text-primary transition-colors line-clamp-2">
                        {newsTitle(related, lang)}
                      </h3>
                      <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                        {newsExcerpt(related, lang)}
                      </p>
                      <div className="mt-auto flex items-center">
                        <Button variant="outline" className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                          <Link href={`/news/${related.id}`}>{t('common.readMore')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionWrapper>
        ) : null}
      </main>

      <ContactCtaSection />
      <Footer />

      {lightboxItems.length > 0 ? (
        <GalleryLightbox
          openIndex={lightboxIndex}
          count={lightboxItems.length}
          onNavigate={(index) => setLightboxIndex(index)}
          onClose={() => setLightboxIndex(null)}
          getLabel={(index) => lightboxItems[index]?.alt ?? title}
          renderItem={(index) => (
            <img
              src={lightboxItems[index]?.src}
              alt={lightboxItems[index]?.alt ?? title}
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
          )}
        />
      ) : null}
    </div>
  );
}
