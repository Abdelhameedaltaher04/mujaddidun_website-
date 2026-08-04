import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';

export default function GalleryPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('gallery.title')}
        description={t('gallery.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('gallery.title') },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="aspect-square bg-muted rounded-xl overflow-hidden hover-elevate transition-all border border-border group relative"
              >
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors z-10"></div>
                <div className="flex items-center justify-center h-full text-muted-foreground/30">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
