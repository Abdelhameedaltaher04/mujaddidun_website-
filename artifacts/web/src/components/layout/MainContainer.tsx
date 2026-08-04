import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ContainerWidth = 'narrow' | 'standard' | 'wide';

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: 'container-narrow',
  standard: 'container-standard',
  wide: 'container-wide',
};

interface MainContainerProps {
  children: ReactNode;
  /** Horizontal width preset from the design system. Defaults to "standard". */
  width?: ContainerWidth;
  className?: string;
}

/**
 * Centered, width-constrained container with responsive horizontal padding.
 * The single source of truth for page gutters across the public site.
 */
export function MainContainer({
  children,
  width = 'standard',
  className,
}: MainContainerProps) {
  return (
    <div
      className={cn(WIDTH_CLASSES[width], 'px-4 sm:px-6 lg:px-8', className)}
    >
      {children}
    </div>
  );
}
