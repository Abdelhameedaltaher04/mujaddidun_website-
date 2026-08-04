import { MainContainer } from '@/components/layout/MainContainer';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  /** Optional id for in-page anchors. */
  id?: string;
  /** Alternate background surface to visually separate consecutive sections. */
  variant?: 'default' | 'muted';
  className?: string;
  'data-testid'?: string;
}

/**
 * Standard vertical rhythm for page sections. Wraps content in a
 * MainContainer so every section shares the same gutters.
 */
export function SectionWrapper({
  children,
  id,
  variant = 'default',
  className,
  'data-testid': testId,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      data-testid={testId}
      className={cn('py-12 md:py-16', variant === 'muted' && 'bg-muted', className)}
    >
      <MainContainer>{children}</MainContainer>
    </section>
  );
}
