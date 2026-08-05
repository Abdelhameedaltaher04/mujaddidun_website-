import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface GalleryLightboxProps {
  /** Index of the open item, or null when closed. */
  openIndex: number | null;
  /** Total number of gallery items. */
  count: number;
  /** Called with the new index when navigating. */
  onNavigate: (index: number) => void;
  /** Called when the lightbox should close. */
  onClose: () => void;
  /** Renders the large view of the item at the given index. */
  renderItem: (index: number) => React.ReactNode;
  /** Accessible caption for the current item. */
  getLabel: (index: number) => string;
}

const SWIPE_THRESHOLD_PX = 48;

/**
 * Fullscreen gallery lightbox: dark overlay, centered media, prev/next
 * arrows, keyboard navigation (arrows + ESC), swipe on touch devices,
 * and smooth open/close transitions (gated by prefers-reduced-motion
 * via Tailwind's motion-safe utilities).
 */
export function GalleryLightbox({
  openIndex,
  count,
  onNavigate,
  onClose,
  renderItem,
  getLabel,
}: GalleryLightboxProps) {
  const { t, dir } = useLocale();
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isOpen = openIndex !== null;

  const goPrev = useCallback(() => {
    if (openIndex === null) return;
    onNavigate((openIndex - 1 + count) % count);
  }, [openIndex, count, onNavigate]);

  const goNext = useCallback(() => {
    if (openIndex === null) return;
    onNavigate((openIndex + 1) % count);
  }, [openIndex, count, onNavigate]);

  // Fade-in on open + focus the close button.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(isOpen));
    if (isOpen) closeButtonRef.current?.focus();
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Keyboard: ESC closes; arrow keys navigate (screen-direction aware).
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (dir === 'rtl') goNext();
        else goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (dir === 'rtl') goPrev();
        else goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dir, goPrev, goNext, onClose]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    // Swiping left pulls the next item in LTR screens; mirror for RTL.
    const forward = deltaX < 0 ? dir !== 'rtl' : dir === 'rtl';
    if (forward) goNext();
    else goPrev();
  };

  const arrowClasses =
    'absolute top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/25 hover:scale-110 focus-ring-standard';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={getLabel(openIndex)}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="gallery-lightbox"
    >
      {/* Close */}
      <button
        ref={closeButtonRef}
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute top-4 end-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/25 hover:scale-110 focus-ring-standard"
        data-testid="button-lightbox-close"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Previous */}
      <button
        type="button"
        aria-label={t('common.previous')}
        onClick={(event) => {
          event.stopPropagation();
          goPrev();
        }}
        className={cn(arrowClasses, 'start-3 md:start-6')}
        data-testid="button-lightbox-prev"
      >
        {dir === 'rtl' ? (
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Next */}
      <button
        type="button"
        aria-label={t('common.next')}
        onClick={(event) => {
          event.stopPropagation();
          goNext();
        }}
        className={cn(arrowClasses, 'end-3 md:end-6')}
        data-testid="button-lightbox-next"
      >
        {dir === 'rtl' ? (
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Media */}
      <figure
        className={cn(
          'w-[80vw] max-w-[80vw] motion-safe:transition-transform motion-safe:duration-300',
          visible ? 'scale-100' : 'scale-95',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex h-[min(80vh,calc(100vh-7rem))] max-h-[80vh] w-full max-w-[80vw] items-center justify-center overflow-hidden [&>*]:max-h-full [&>*]:max-w-full [&>*]:object-contain [&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain"
          data-testid="lightbox-media-frame"
        >
          {renderItem(openIndex)}
        </div>
        <figcaption className="mt-5 text-center">
          <div className="text-sm md:text-base font-semibold text-white" data-testid="text-lightbox-title">
            {getLabel(openIndex)}
          </div>
          <div className="mt-3 text-xs md:text-sm text-white/60 tracking-widest" dir="ltr" data-testid="text-lightbox-counter">
            {openIndex + 1} / {count}
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
