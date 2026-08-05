import { MainContainer } from '@/components/layout/MainContainer';
import {
  Breadcrumb,
  type BreadcrumbItemDef,
} from '@/components/layout/Breadcrumb';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional breadcrumb trail rendered above the title. */
  breadcrumbs?: BreadcrumbItemDef[];
  /** Optional actions (buttons etc.) aligned to the end of the header. */
  actions?: ReactNode;
}

/**
 * Standard header block for inner pages: optional breadcrumb,
 * page title, optional description, and optional actions.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-muted">
      <div
        className="pointer-events-none absolute -top-24 end-[-5rem] h-64 w-64 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-8rem] start-[-5rem] h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <MainContainer className="relative py-9 md:py-12">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-5">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2" aria-hidden="true">
              <span className="h-px w-10 bg-secondary" />
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="h-px w-5 bg-primary" />
            </div>
            <h1
              className="bg-gradient-to-l from-primary via-primary to-secondary bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent text-balance md:text-3xl"
              data-testid="text-page-title"
            >
              {title}
            </h1>
            <div
              className="mt-4 h-1.5 w-20 rounded-full bg-gradient-to-r from-secondary to-primary"
              aria-hidden="true"
            />
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </MainContainer>
    </div>
  );
}
