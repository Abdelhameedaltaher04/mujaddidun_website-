import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Link } from 'wouter';

export default function NewsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('news.title')} 
        description={t('news.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('news.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
               <Link key={i} href="/news" className="flex flex-col rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group focus-ring-standard overflow-hidden">
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                     <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                  </div>
                  <div className="flex flex-col justify-center p-6 flex-1">
                     <div className="text-xs text-muted-foreground mb-2 font-medium">{t(`news.items.${i}.date`)}</div>
                     <h3 className="font-bold font-display text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">{t(`news.items.${i}.title`)}</h3>
                     <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">{t(`news.items.${i}.excerpt`)}</p>
                     <div className="text-primary font-bold text-sm mt-auto">{t('common.readMore')}</div>
                  </div>
               </Link>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
