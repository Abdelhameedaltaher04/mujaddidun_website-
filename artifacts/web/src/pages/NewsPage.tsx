import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';

export default function NewsPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('news.title')}
        description={t('news.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('news.title') },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('news.empty')}</h3>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
