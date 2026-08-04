import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FaqPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('faq.title')} 
        description={t('faq.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('faq.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {[1, 2, 3, 4].map((item) => (
                <AccordionItem key={item} value={`item-${item}`} className="border-border">
                  <AccordionTrigger className="text-lg font-medium text-start hover:text-primary transition-colors focus-ring-standard rounded-md">
                     {t(`faq.items.${item}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    {t(`faq.items.${item}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
