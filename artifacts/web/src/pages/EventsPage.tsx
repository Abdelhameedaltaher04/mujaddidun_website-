import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EventsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('events.title')}
        description={t('events.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('events.title') },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="upcoming">
                  {t('events.upcoming')}
                </TabsTrigger>
                <TabsTrigger value="past">{t('events.past')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming">
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">{t('events.empty')}</p>
              </div>
            </TabsContent>

            <TabsContent value="past">
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">{t('events.empty')}</p>
              </div>
            </TabsContent>
          </Tabs>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
