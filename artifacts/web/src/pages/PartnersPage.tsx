import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';

export default function PartnersPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('partners.title')} 
        description={t('partners.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('partners.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="aspect-[3/2] bg-card rounded-2xl border border-border flex flex-col items-center justify-center p-6 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all hover-elevate shadow-sm group">
                <div className="w-16 h-16 rounded-full bg-muted mb-4 group-hover:bg-primary/5 transition-colors"></div>
                <span className="text-foreground font-semibold text-center text-sm md:text-base">{t(`partners.items.${item}`)}</span>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
