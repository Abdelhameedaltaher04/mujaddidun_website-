import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { usePublicPartners } from '@/hooks/usePublicPartners';
import { partnerName, type PublicPartner } from '@/services/publicPartners';

function PartnerCard({ partner, lang }: { partner: PublicPartner; lang: 'ar' | 'en' }) {
  const name = partnerName(partner, lang);
  const initial = name.charAt(0);

  const card = (
    <div className="h-36 bg-card rounded-2xl border border-transparent flex flex-col items-center justify-center p-4 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 shadow-sm hover:shadow-lg hover:border-secondary hover:scale-105 hover:shadow-secondary/20 relative overflow-hidden group/card cursor-pointer">
      {partner.logo_url ? (
        <img
          src={partner.logo_url}
          alt={name}
          loading="lazy"
          className="h-20 w-auto max-w-full object-contain mb-2"
          onError={(e) => {
            // Broken logo: fall back to the initial badge.
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`w-20 h-20 rounded-full bg-primary/5 text-primary items-center justify-center mb-2 group-hover/card:bg-primary/10 transition-colors ${partner.logo_url ? 'hidden' : 'flex'}`}>
        <span className="font-display text-4xl font-bold">{initial}</span>
      </div>
      <span className="text-xs font-bold text-center text-muted-foreground group-hover/card:text-foreground line-clamp-1 w-full px-2">{name}</span>
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
        data-testid={`link-partner-${partner.id}`}
      >
        {card}
      </a>
    );
  }
  return card;
}

export function PartnersCarousel() {
  const { t, dir, locale } = useLocale();
  const lang = locale as 'ar' | 'en';
  const settings = usePublicSettings();
  const partnersQuery = usePublicPartners();
  const partners = partnersQuery.data ?? [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      direction: dir as 'rtl' | 'ltr',
      align: 'start',
      dragFree: true,
    },
    [AutoScroll({ playOnInit: true, stopOnInteraction: false, speed: 1, direction: 'forward' })]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      const autoScroll = emblaApi.plugins().autoScroll;
      if (autoScroll) autoScroll.stop();
    }
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Duplicate items slightly so loop feels seamless on very wide screens
  const items = partners.length > 0 ? [...partners, ...partners] : [];

  // Admin-controlled visibility (hidden when show_partners is off).
  if (settings && !settings.controls.show_partners) return null;

  // No published partners (or the list failed to load): hide the carousel cleanly.
  if (!partnersQuery.isPending && items.length === 0) return null;

  if (partnersQuery.isPending) {
    return (
      <div className="flex gap-6 py-8 overflow-hidden" data-testid="partners-carousel-loading">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-[0_0_50%] sm:flex-[0_0_33.333%] md:flex-[0_0_25%] lg:flex-[0_0_20%] min-w-0">
            <div className="h-36 bg-muted/50 rounded-2xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="relative w-full group"
      data-testid="partners-carousel"
      onMouseEnter={() => emblaApi?.plugins().autoScroll?.stop()}
      onMouseLeave={() => {
        const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!isReducedMotion) emblaApi?.plugins().autoScroll?.play();
      }}
      onFocus={() => emblaApi?.plugins().autoScroll?.stop()}
      onBlur={() => {
        const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!isReducedMotion) emblaApi?.plugins().autoScroll?.play();
      }}
    >
      <div className="overflow-hidden py-8" ref={emblaRef}>
        <div className="flex touch-pan-y -ms-6" style={{ backfaceVisibility: 'hidden' }}>
          {items.map((partner, index) => (
            <div key={`${partner.id}-${index}`} className="flex-[0_0_50%] sm:flex-[0_0_33.333%] md:flex-[0_0_25%] lg:flex-[0_0_20%] min-w-0 ps-6" data-testid={index < partners.length ? `partner-slide-${partner.id}` : undefined}>
              <PartnerCard partner={partner} lang={lang} />
            </div>
          ))}
        </div>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-1/2 -translate-y-1/2 start-0 md:start-4 rounded-full w-10 h-10 bg-card/80 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity focus-ring-standard shadow-sm border-border"
        onClick={scrollPrev}
        aria-label={t('common.previous')}
      >
        {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-1/2 -translate-y-1/2 end-0 md:end-4 rounded-full w-10 h-10 bg-card/80 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity focus-ring-standard shadow-sm border-border"
        onClick={scrollNext}
        aria-label={t('common.next')}
      >
        {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </Button>
    </div>
  );
}
