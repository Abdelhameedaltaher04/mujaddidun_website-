import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/services/adminGallery';

interface AdminImageLightboxProps {
  images: GalleryImage[];
  /** Index of the open image, or null when closed. */
  openIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/**
 * Fullscreen admin lightbox: prev/next, keyboard navigation (arrows +
 * ESC), zoom toggle, and an "n / total" counter.
 */
export function AdminImageLightbox({
  images,
  openIndex,
  onNavigate,
  onClose,
}: AdminImageLightboxProps) {
  const { t, locale, dir } = useLocale();
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;
  const isOpen = openIndex !== null && count > 0;

  const goPrev = useCallback(() => {
    if (openIndex === null) return;
    setZoomed(false);
    onNavigate((openIndex - 1 + count) % count);
  }, [openIndex, count, onNavigate]);

  const goNext = useCallback(() => {
    if (openIndex === null) return;
    setZoomed(false);
    onNavigate((openIndex + 1) % count);
  }, [openIndex, count, onNavigate]);

  useEffect(() => {
    if (!isOpen) {
      setZoomed(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') {
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
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [isOpen, dir, goPrev, goNext, onClose]);

  if (!isOpen || openIndex === null) return null;

  const image = images[openIndex];
  if (!image) return null;
  const alt = locale === 'ar' ? image.alt_ar : image.alt_en;
  const caption = locale === 'ar' ? image.caption_ar : image.caption_en;

  const controlClasses =
    'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-colors hover:bg-white/25';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      data-testid="admin-image-lightbox"
    >
      {/* Top bar: counter + zoom + close */}
      <div
        className="absolute top-4 inset-x-4 z-10 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm border border-white/20"
          dir="ltr"
          data-testid="lightbox-counter"
        >
          {openIndex + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('admin.gallery.zoom')}
            aria-pressed={zoomed}
            onClick={() => setZoomed((z) => !z)}
            className={controlClasses}
            data-testid="button-lightbox-zoom"
          >
            {zoomed ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            aria-label={t('admin.gallery.close')}
            onClick={onClose}
            className={controlClasses}
            data-testid="button-lightbox-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Previous / Next (physical sides; labels are direction-aware) */}
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label={t('admin.gallery.previous')}
            onClick={(e) => {
              e.stopPropagation();
              if (dir === 'rtl') goNext();
              else goPrev();
            }}
            className={cn(
              controlClasses,
              'absolute left-4 top-1/2 z-10 -translate-y-1/2',
            )}
            data-testid="button-lightbox-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label={t('admin.gallery.next')}
            onClick={(e) => {
              e.stopPropagation();
              if (dir === 'rtl') goPrev();
              else goNext();
            }}
            className={cn(
              controlClasses,
              'absolute right-4 top-1/2 z-10 -translate-y-1/2',
            )}
            data-testid="button-lightbox-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      {/* Image */}
      <div
        className={cn(
          'flex max-h-full max-w-full items-center justify-center p-12',
          zoomed ? 'overflow-auto' : 'overflow-hidden',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={alt}
          onClick={() => setZoomed((z) => !z)}
          className={cn(
            'select-none transition-transform duration-200',
            zoomed
              ? 'max-w-none scale-150 cursor-zoom-out'
              : 'max-h-[80vh] max-w-full cursor-zoom-in object-contain',
          )}
          data-testid="lightbox-image"
        />
      </div>

      {/* Caption */}
      {caption ? (
        <p
          className="absolute bottom-4 inset-x-4 z-10 text-center text-sm text-white/85"
          onClick={(e) => e.stopPropagation()}
          data-testid="lightbox-caption"
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
