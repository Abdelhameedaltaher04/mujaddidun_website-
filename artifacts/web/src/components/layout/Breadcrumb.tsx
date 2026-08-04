import { Fragment } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export interface BreadcrumbItemDef {
  /** Visible label (already translated). */
  label: string;
  /** Link target; omit for the current page (last item). */
  href?: string;
}

/**
 * Direction-aware breadcrumb trail. The separator chevron points
 * forward in the reading direction (left in RTL, right in LTR).
 */
export function Breadcrumb({ items }: { items: BreadcrumbItemDef[] }) {
  const { t, dir } = useLocale();
  const Separator = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label={t('breadcrumb.label')} data-testid="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="focus-ring-standard rounded-sm transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className="text-foreground"
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <Separator className="h-3.5 w-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
