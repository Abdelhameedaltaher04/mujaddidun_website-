import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicPartners } from '@/hooks/usePublicPartners';
import { partnerName, type PublicPartner } from '@/services/publicPartners';
import { getApiError } from '@/services/api';

function PartnerTile({ partner, lang }: { partner: PublicPartner; lang: 'ar' | 'en' }) {
  const name = partnerName(partner, lang);
  const description = (lang === 'ar' ? partner.description_ar : partner.description_en) || '';

  const tile = (
    <div className="aspect-[3/2] bg-card rounded-2xl border border-border flex flex-col items-center justify-center p-6 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all hover-elevate shadow-sm group h-full">
      {partner.logo_url ? (
        <img
          src={partner.logo_url}
          alt={name}
          loading="lazy"
          className="h-16 w-auto max-w-full object-contain mb-4"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`w-16 h-16 rounded-full bg-muted mb-4 group-hover:bg-primary/5 transition-colors items-center justify-center text-primary font-display text-2xl font-bold ${partner.logo_url ? 'hidden' : 'flex'}`}>
        {name.charAt(0)}
      </div>
      <span className="text-foreground font-semibold text-center text-sm md:text-base" data-testid={`text-partner-name-${partner.id}`}>{name}</span>
      {description ? (
        <span className="text-muted-foreground text-xs text-center mt-1 line-clamp-2">{description}</span>
      ) : null}
    </div>
  );

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={name}
        className="block focus-ring-standard rounded-2xl"
        data-testid={`link-partner-page-${partner.id}`}
      >
        {tile}
      </a>
    );
  }
  return tile;
}

export default function PartnersPage() {
  const { t, locale } = useLocale();
  const lang = locale as 'ar' | 'en';
  const partnersQuery = usePublicPartners();
  const partners = partnersQuery.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('partners.title')} 
        description={t('partners.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('partners.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          {partnersQuery.isPending ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8" data-testid="partners-list-loading">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="aspect-[3/2] rounded-2xl" />
              ))}
            </div>
          ) : partnersQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="partners-list-error">
              <p className="text-muted-foreground mb-6">
                {getApiError(partnersQuery.error).status ? t('partners.loadError') : t('news.networkError')}
              </p>
              <Button onClick={() => partnersQuery.refetch()} data-testid="button-partners-retry">
                {t('news.retry')}
              </Button>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="partners-list-empty">
              <p className="text-muted-foreground">{t('partners.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {partners.map((partner) => (
                <PartnerTile key={partner.id} partner={partner} lang={lang} />
              ))}
            </div>
          )}
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />
    </div>
  );
}
