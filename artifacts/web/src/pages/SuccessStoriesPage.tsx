import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SuccessStoriesPage() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

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
          <div className="grid gap-8 lg:grid-cols-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex flex-col sm:flex-row gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm hover-elevate transition-all group overflow-hidden">
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-square bg-muted rounded-xl flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/20 transition-colors"></div>
                </div>
                <div className="flex flex-col flex-1 justify-center">
                  <h3 className="text-2xl font-bold font-display mb-3 group-hover:text-secondary transition-colors">{t(`successStories.items.${item}.title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-1 mb-6">{t(`successStories.items.${item}.desc`)}</p>
                  <Button variant="link" className="self-start p-0 h-auto text-secondary font-bold group/btn">
                    {t('common.readMore')} <ArrowIcon className="w-4 h-4 ms-2 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
