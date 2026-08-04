import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';

export default function SuccessStoriesPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('successStories.title')} 
        description={t('successStories.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('successStories.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex flex-col sm:flex-row gap-6 bg-card p-6 rounded-xl border border-border shadow-sm hover-elevate transition-all">
                <div className="sm:w-1/3 aspect-square sm:aspect-auto bg-muted rounded-lg flex-shrink-0"></div>
                <div className="flex flex-col flex-1">
                  <h3 className="text-xl font-bold font-display mb-2">{t('successStories.itemTitle', { item })}</h3>
                  <p className="text-muted-foreground text-sm flex-1 mb-4">{t('successStories.itemDesc')}</p>
                  <Button variant="outline" size="sm" className="self-start">{t('common.readMore')}</Button>
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
