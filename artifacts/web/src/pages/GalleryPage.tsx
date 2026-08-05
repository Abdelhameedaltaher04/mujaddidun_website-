import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { GalleryLightbox } from '@/components/layout/GalleryLightbox';
import { useLocale } from '@/contexts/LocaleContext';

const GALLERY_ITEMS = [1, 2, 3, 4, 5, 6] as const;

function PlaceholderVisual({ iconClassName }: { iconClassName: string }) {
  return (
    <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function GalleryPage() {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GALLERY_ITEMS.map((item, index) => (
              <button
                type="button"
                key={item}
                onClick={() => setOpenIndex(index)}
                aria-label={t(`gallery.items.${item}`)}
                className="group rounded-2xl overflow-hidden shadow-sm hover-elevate transition-all border border-border flex flex-col bg-card text-start cursor-pointer focus-ring-standard"
                data-testid={`button-gallery-item-${item}`}
              >
                <div className="aspect-[4/3] bg-muted relative w-full">
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors z-10"></div>
                  <div className="flex items-center justify-center h-full text-muted-foreground/30">
                    <PlaceholderVisual iconClassName="w-12 h-12" />
                  </div>
                </div>
                <div className="p-4 border-t border-border w-full">
                  <h3 className="font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                    {t(`gallery.items.${item}`)}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
      <GalleryLightbox
        openIndex={openIndex}
        count={GALLERY_ITEMS.length}
        onNavigate={setOpenIndex}
        onClose={() => setOpenIndex(null)}
        getLabel={(index) => t(`gallery.items.${GALLERY_ITEMS[index]}`)}
        renderItem={() => (
          <div className="aspect-[4/3] w-full rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30 shadow-2xl">
            <PlaceholderVisual iconClassName="w-20 h-20" />
          </div>
        )}
      />
    </div>
  );
}
