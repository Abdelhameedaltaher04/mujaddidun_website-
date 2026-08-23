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
        own. `flex-col-reverse` puts the first child nearest the bottom edge, so
        the assistant launcher is listed first and back-to-top sits above it.
        Back-to-top only fades (it never unmounts), so the launcher's position
        never shifts on scroll.

        The launcher has to be the bottom-most item for it to line up with the
        WhatsApp button in the opposite corner: while it sat above back-to-top,
        that control reserved its 48px plus the 12px gap even at the top of the
        page where it is invisible, floating the launcher 60px higher than its
        counterpart for no reason a visitor could see.

        Vertical offset: WhatsApp uses `bottom-5 sm:bottom-6` and is 48px tall,
        so its centre sits 20+24=44px (24+24=48px from `sm`) above the viewport
        edge. The launcher is 56px, so matching those centres means sitting half
        the 8px height difference lower — `bottom-4 sm:bottom-5`. The numbers are
        derived from the two button heights, so they stay correct as long as
        those heights do; both are stated here so a future size change is
        obviously a change to this sum too.
      */}
      <div
        className={cn(
          'fixed bottom-4 end-5 z-40 flex flex-col-reverse items-center gap-3 transition-all duration-300 sm:bottom-5 sm:end-6',
          // While the panel is open it occupies this corner, so the stack steps
          // out of the way rather than overlapping it.
          isChatOpen && 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ChatWidget open={isChatOpen} onOpenChange={setIsChatOpen} />

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
