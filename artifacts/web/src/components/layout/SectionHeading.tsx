import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionHeadingProps {
  /** Short label rendered above the title. Omit for a decorative-only accent. */
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Horizontal alignment of the whole heading block. Defaults to "center". */
  align?: 'center' | 'start';
  /** Which brand color leads the accent. Defaults to "secondary" (coral). */
  accent?: 'primary' | 'secondary';
  /** Title scale. "lg" for primary section headers, "md" for sub-headers (e.g. paired columns). */
  size?: 'lg' | 'md';
  /** Optional trailing element (e.g. a "View All" button), placed opposite the heading on "start" alignment. */
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  id?: string;
}

/**
 * Premium, reusable section heading used across the homepage: kicker label,
 * large display title, brand-colored accent, and an optional supporting
 * description. Reveals with a soft fade/slide on first scroll into view
 * (instant when prefers-reduced-motion is set).
 */
export function SectionHeading({
  kicker,
  title,
  description,
  align = 'center',
  accent = 'secondary',
  size = 'lg',
  action,
  className,
  titleClassName,
  id,
}: SectionHeadingProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const isCentered = align === 'center';
  // Keep section titles visually consistent: the orange brand accent leads
  // every title, while the prop remains available for existing call sites.
  const resolvedAccent = accent === 'primary' ? 'secondary' : accent;
  const accentBg = resolvedAccent === 'secondary' ? 'bg-secondary' : 'bg-primary';
  const accentText = resolvedAccent === 'secondary' ? 'text-secondary' : 'text-primary';
  const accentGradient =
    resolvedAccent === 'secondary'
      ? 'from-secondary to-primary'
      : 'from-primary to-secondary';

  const headingBlock = (
    <div className={cn(!isCentered && action ? 'max-w-3xl' : 'max-w-3xl', isCentered && 'mx-auto')}>
      {kicker ? (
        <div
          className={cn(
            'flex items-center gap-2 mb-4',
            isCentered ? 'justify-center' : 'justify-start',
          )}
        >
          <span className={cn('h-px w-8', accentBg)} aria-hidden="true" />
          <span
            className={cn(
              'text-sm md:text-base font-bold tracking-wide',
              accentText,
            )}
          >
            {kicker}
          </span>
          {isCentered && (
            <span className={cn('h-px w-8', accentBg)} aria-hidden="true" />
          )}
        </div>
      ) : (
        <div
          className={cn(
            'h-1.5 w-12 rounded-full bg-gradient-to-r mb-5',
            accentGradient,
            isCentered && 'mx-auto',
          )}
          aria-hidden="true"
        />
      )}
      <h2
        id={id}
        className={cn(
          'bg-gradient-to-l from-primary via-primary to-secondary bg-clip-text font-display font-bold tracking-tight text-transparent text-balance leading-tight',
          size === 'lg' ? 'text-lg lg:text-xl' : 'text-base lg:text-lg',
          titleClassName,
        )}
      >
        {title}
      </h2>
      <span
        aria-hidden="true"
        className={cn(
          'block h-1.5 w-16 rounded-full mt-4 bg-gradient-to-r',
          accentGradient,
          isCentered && 'mx-auto',
        )}
      />
      {description && (
        <p className={cn('text-muted-foreground mt-4', size === 'lg' ? 'text-lg' : 'text-base')}>
          {description}
        </p>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cn(
        'mb-12 lg:mb-16 transition-all duration-700 ease-out',
        isCentered ? 'text-center' : 'text-start',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className,
      )}
    >
      {action ? (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {headingBlock}
          <div className="shrink-0">{action}</div>
        </div>
      ) : (
        headingBlock
      )}
    </div>
  );
}
