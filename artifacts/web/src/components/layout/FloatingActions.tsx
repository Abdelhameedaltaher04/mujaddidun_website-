import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useLocale } from '@/contexts/LocaleContext';
import { usePublicSettings, toWhatsAppNumber } from '@/hooks/usePublicSettings';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { cn } from '@/lib/utils';

// Fallback contact number while settings load, normalized for wa.me.
const DEFAULT_WHATSAPP_NUMBER = '96261234567';

export function FloatingActions() {
  const { t } = useLocale();
  const settings = usePublicSettings();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const whatsappNumber = settings
    ? toWhatsAppNumber(settings.contact.whatsapp || settings.contact.phone)
    : DEFAULT_WHATSAPP_NUMBER;

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
      {/*
        End-side stack. One fixed container owns the placement of everything in
        this corner, so the assistant launcher does not need positioning of its
        own. `flex-col-reverse` puts the first child nearest the bottom edge:
        back-to-top keeps the exact spot it has always had, and the assistant
        launcher sits directly above it. Back-to-top only fades (it never
        unmounts), so the launcher's position never shifts on scroll.
      */}
      <div
        className={cn(
          'fixed bottom-5 end-5 z-40 flex flex-col-reverse items-center gap-3 transition-all duration-300 sm:bottom-6 sm:end-6',
          // While the panel is open it occupies this corner, so the stack steps
          // out of the way rather than overlapping it.
          isChatOpen && 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <button
          type="button"
          aria-label={t('common.backToTop')}
          onClick={scrollToTop}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-secondary/35 focus-ring-standard motion-reduce:transition-none motion-reduce:hover:scale-100',
            showBackToTop
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0',
          )}
          data-testid="button-back-to-top"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>

        <ChatWidget open={isChatOpen} onOpenChange={setIsChatOpen} />
      </div>

      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('common.whatsapp')}
          className="fixed bottom-5 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40 focus-ring-standard motion-reduce:transition-none motion-reduce:hover:scale-100 sm:bottom-6 sm:start-6"
          data-testid="link-floating-whatsapp"
        >
          <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
