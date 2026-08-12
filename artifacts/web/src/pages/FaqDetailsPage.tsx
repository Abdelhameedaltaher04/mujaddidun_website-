import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from 'wouter';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePublicFaq } from '@/hooks/usePublicFaqs';
import { faqQuestion, faqAnswer } from '@/services/publicFaqs';
import { getApiError } from '@/services/api';
import { applySeoMeta } from '@/lib/seo';

export default function FaqDetailsPage() {
  const { t, dir, locale } = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const validId = !!id && /^\d+$/.test(id);
  const { data: faq, isPending, isError, error, refetch } = usePublicFaq(validId ? id : undefined);

  const status = isError ? getApiError(error).status : undefined;
  const notFound = !validId || status === 404;
  const lang = locale as 'ar' | 'en';

  const question = faq ? faqQuestion(faq, lang) : '';
  const answer = faq ? faqAnswer(faq, lang) : '';

  // SEO: reflect the loaded FAQ in title/description/OG tags.
  useEffect(() => {
    if (!faq) return;
    const description = answer.slice(0, 160);
    return applySeoMeta({
      title: question,
      description,
      ogTitle: question,
      ogDescription: description,
    });
  }, [faq, question, answer]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const backButton = (
    <Button size="lg" className="mt-8" asChild data-testid="button-back-to-faqs">
      <Link href="/faq">
        <BackIcon className="w-5 h-5 me-2" />
        {t('faq.backToFaqs')}
      </Link>
    </Button>
  );

  const shell = (content: React.ReactNode, breadcrumbLast?: string) => (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('faq.title')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('faq.title'), href: '/faq' },
          ...(breadcrumbLast ? [{ label: breadcrumbLast }] : []),
        ]}
      />
      {content}
      <ContactCtaSection />
      <Footer />
    </div>
  );

  if (notFound || isError) {
    const message = notFound ? t('faq.notFound') : t('faq.loadError');
    return shell(
      <main
        className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center"
        data-testid={notFound ? 'faq-details-not-found' : 'faq-details-error'}
      >
        <SectionHeading title={message} accent="primary" />
        {!notFound ? (
          <Button size="lg" className="mt-8" onClick={() => void refetch()} data-testid="button-faq-details-retry">
            {t('common.retry')}
          </Button>
        ) : null}
        {backButton}
      </main>,
    );
  }

  if (isPending || !faq) {
    return shell(
      <main className="flex-1">
        <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
          <div className="max-w-3xl mx-auto" data-testid="faq-details-loading">
            <Skeleton className="h-7 w-24 rounded-full mb-6" />
            <Skeleton className="h-10 w-3/4 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </SectionWrapper>
      </main>,
    );
  }

  return shell(
    <main className="flex-1">
      <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
        <article className="max-w-3xl mx-auto">
          {faq.category ? (
            <span
              className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-sm rounded-full mb-6"
              data-testid="text-faq-category"
            >
              {t(`faq.categories.${faq.category}`)}
            </span>
          ) : null}
          <h1
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8 leading-tight text-balance"
            data-testid="text-faq-question"
          >
            {question}
          </h1>
          <div
            className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-foreground/90 leading-relaxed text-lg whitespace-pre-line"
            data-testid="text-faq-answer"
          >
            {answer}
          </div>
          {backButton}
        </article>
      </SectionWrapper>
    </main>,
    question,
  );
}
