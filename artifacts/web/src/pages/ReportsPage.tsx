import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';

export default function ReportsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('reports.title') },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground">{t('reports.empty')}</p>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
