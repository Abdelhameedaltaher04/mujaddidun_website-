import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';

export default function EventsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('events.title')} 
        description={t('events.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('events.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="upcoming">{t('events.upcoming')}</TabsTrigger>
                <TabsTrigger value="past">{t('events.past')}</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming">
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                   <div key={i} className="flex gap-4 p-6 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group overflow-hidden">
                      <div className="w-20 h-20 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                         <span className="text-2xl font-bold font-display leading-none">{t(`events.items.${i}.day`)}</span>
                         <span className="text-sm font-medium">{t(`events.items.${i}.month`)}</span>
                      </div>
                      <div className="flex flex-col flex-1">
                         <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors">{t(`events.items.${i}.title`)}</h3>
                         <div className="text-sm text-muted-foreground flex gap-3 mb-3">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t(`events.items.${i}.location`)}</span>
                         </div>
                         <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{t(`events.items.${i}.desc`)}</p>
                         <Button variant="outline" className="self-start group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                            <Link href="/events">{t('home.events.register')}</Link>
                         </Button>
                      </div>
                   </div>
                ))}
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
