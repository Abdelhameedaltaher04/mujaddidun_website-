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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="aspect-video bg-card rounded-xl border border-border flex items-center justify-center p-6 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all hover-elevate shadow-sm">
                <span className="text-muted-foreground font-semibold">{t('partners.partnerLabel', { item })}</span>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
