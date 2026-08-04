import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const PARTNERS = [
  { id: '1', logo: undefined },
  { id: '2', logo: undefined },
  { id: '3', logo: undefined },
  { id: '4', logo: undefined },
  { id: '5', logo: undefined },
  { id: '6', logo: undefined },
  { id: '7', logo: undefined },
  { id: '8', logo: undefined },
];

export function PartnersCarousel() {
  const { t, dir } = useLocale();
  
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
  const items = [...PARTNERS, ...PARTNERS];

  return (
    <div 
      className="relative max-w-7xl mx-auto px-4 md:px-12 group"
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
          {items.map((partner, index) => {
            const partnerName = t(`partners.items.${partner.id}`);
            const initial = partnerName.charAt(0);
            
            return (
              <div key={`${partner.id}-${index}`} className="flex-[0_0_50%] sm:flex-[0_0_33.333%] md:flex-[0_0_25%] lg:flex-[0_0_20%] min-w-0 ps-6">
                <div className="h-36 bg-card rounded-2xl border border-transparent flex flex-col items-center justify-center p-4 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 shadow-sm hover:shadow-lg hover:border-secondary hover:scale-105 hover:shadow-secondary/20 relative overflow-hidden group/card cursor-pointer">
                  {partner.logo ? (
                    <img src={partner.logo} alt={partnerName} className="h-20 w-auto max-w-full object-contain mb-2" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-2 group-hover/card:bg-primary/10 transition-colors">
                      <span className="font-display text-4xl font-bold">{initial}</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-center text-muted-foreground group-hover/card:text-foreground line-clamp-1 w-full px-2">{partnerName}</span>
                </div>
              </div>
            );
          })}
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
