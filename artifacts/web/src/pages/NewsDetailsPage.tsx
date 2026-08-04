import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'wouter';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Image as ImageIcon } from 'lucide-react';
import { FaFacebookF, FaWhatsapp } from 'react-icons/fa6';
import { GalleryLightbox } from '@/components/layout/GalleryLightbox';

/** Featured image + 3 gallery-strip images. */
const ARTICLE_IMAGE_COUNT = 4;

export default function NewsDetailsPage() {
  const { t, dir } = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isValidId = id && ['1', '2', '3'].includes(id);

  if (!isValidId) {
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
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <SectionHeading title={t('news.notFound')} description={t('news.empty')} accent="primary" />
          <Button size="lg" className="mt-8" asChild>
            <Link href="/news">
              {dir === 'rtl' ? <ArrowRight className="w-5 h-5 me-2" /> : <ArrowLeft className="w-5 h-5 me-2" />}
              {t('news.backToNews')}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = t(`news.items.${id}.title`);
  const date = t(`news.items.${id}.date`);
  const category = t(`news.items.${id}.category`);
  const body1 = t(`news.items.${id}.body1`);
  const body2 = t(`news.items.${id}.body2`);
  const body3 = t(`news.items.${id}.body3`);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);

  const relatedIds = ['1', '2', '3'].filter(n => n !== id);

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
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-sm rounded-full mb-6">
                {category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6 leading-tight text-balance">
                {title}
              </h1>
              <div className="flex items-center justify-center text-muted-foreground gap-2 font-medium">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{date}</span>
              </div>
            </div>

            {/* Featured Image Placeholder */}
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              aria-label={title}
              className="w-full aspect-[2/1] rounded-3xl bg-muted border border-border flex items-center justify-center mb-12 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 focus-ring-standard"
              data-testid="button-article-featured-image"
            >
              <div className="text-muted-foreground/40 flex flex-col items-center">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              </div>
            </button>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-6 text-foreground/90 leading-relaxed mb-12">
              <p>{body1}</p>
              <p>{body2}</p>
              <p>{body3}</p>
            </div>

            {/* Gallery Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
              {[1, 2, 3].map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setLightboxIndex(n)}
                  aria-label={`${title} ${n}`}
                  className="aspect-[4/3] rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 focus-ring-standard"
                  data-testid={`button-article-gallery-${n}`}
                >
                   <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                </button>
              ))}
            </div>

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
        <SectionWrapper variant="muted" className="border-t border-border">
          <SectionHeading title={t('news.related')} accent="secondary" align="start" className="mb-10" />
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto md:mx-0">
            {relatedIds.map((relId) => (
              <div key={relId} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate-2 transition-all overflow-hidden group">
                 <div className="aspect-[16/9] bg-muted relative flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                    <div className="absolute top-4 start-4 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary border border-border shadow-sm">
                      {t(`news.items.${relId}.category`)}
                    </div>
                 </div>
                 <div className="p-6 md:p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>{t(`news.items.${relId}.date`)}</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-foreground mb-4 group-hover:text-primary transition-colors line-clamp-2">
                      {t(`news.items.${relId}.title`)}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                      {t(`news.items.${relId}.excerpt`)}
                    </p>
                    <div className="mt-auto flex items-center">
                       <Button variant="outline" className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                         <Link href={`/news/${relId}`}>{t('common.readMore')}</Link>
                       </Button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>

      <Footer />

      <GalleryLightbox
        openIndex={lightboxIndex}
        count={ARTICLE_IMAGE_COUNT}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        getLabel={(index) => (index === 0 ? title : `${title} ${index}`)}
        renderItem={() => (
          <div className="aspect-[4/3] w-full rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30 shadow-2xl">
            <ImageIcon className="w-20 h-20" />
          </div>
        )}
      />
    </div>
  );
}
