import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

// Existing public contact number, normalized for wa.me.
const WHATSAPP_NUMBER = '96261234567';

export function FloatingActions() {
  const { t } = useLocale();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 360);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('common.backToTop')}
        onClick={scrollToTop}
        className={cn(
          'fixed bottom-5 end-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-secondary/35 focus-ring-standard sm:bottom-6 sm:end-6',
          showBackToTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0',
        )}
        data-testid="button-back-to-top"
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('common.whatsapp')}
        className="fixed bottom-5 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40 focus-ring-standard sm:bottom-6 sm:start-6"
        data-testid="link-floating-whatsapp"
      >
        <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
      </a>
    </>
  );
}