import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicFaqs } from '@/hooks/usePublicFaqs';
import { faqQuestion, faqAnswer } from '@/services/publicFaqs';

export default function FaqPage() {
  const { t, locale } = useLocale();
  const faqsQuery = usePublicFaqs();
  const faqs = faqsQuery.data ?? [];

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
            {faqsQuery.isLoading ? (
              <div className="space-y-4" data-testid="faq-loading">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : faqsQuery.isError ? (
              <div className="py-8 text-center" data-testid="faq-error">
                <p className="text-muted-foreground mb-4">{t('faq.loadError')}</p>
                <Button variant="outline" onClick={() => void faqsQuery.refetch()} data-testid="button-faq-retry">
                  {t('common.retry')}
                </Button>
              </div>
            ) : faqs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground" data-testid="faq-empty">
                {t('faq.empty')}
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={`faq-${faq.id}`} className="border-border">
                    <AccordionTrigger
                      className="text-lg font-medium text-start hover:text-primary transition-colors focus-ring-standard rounded-md"
                      data-testid={`faq-question-${faq.id}`}
                    >
                      <span className="flex flex-col items-start gap-1">
                        {faq.category && (
                          <span className="text-xs font-semibold text-secondary">
                            {t(`faq.categories.${faq.category}`)}
                          </span>
                        )}
                        <span>{faqQuestion(faq, locale)}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                      {faqAnswer(faq, locale)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
