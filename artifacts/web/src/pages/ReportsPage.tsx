import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('reports.title')} 
        description={t('reports.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('reports.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['2023', '2022', '2021'].map((year) => (
               <div key={year} className="flex items-center gap-4 p-6 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group overflow-hidden">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                     <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col flex-1">
                     <h3 className="font-bold text-foreground mb-1">{t(`reports.items.${year}`)}</h3>
                     <p className="text-sm text-muted-foreground">{year}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-label={t('reports.download')}>
                    <Download className="w-5 h-5" />
                  </Button>
               </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
