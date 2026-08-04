import { MainContainer } from '@/components/layout/MainContainer';
import { Breadcrumb, type BreadcrumbItemDef } from '@/components/layout/Breadcrumb';
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
export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-muted">
      <MainContainer className="py-8 md:py-10">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-3">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </MainContainer>
    </div>
  );
}
