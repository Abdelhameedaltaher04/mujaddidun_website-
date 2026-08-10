import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { FaqCategory, FaqStatus } from '@/services/adminFaqs';

const STATUS_STYLES: Record<FaqStatus, string> = {
  published:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  draft:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  archived:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function FaqStatusBadge({ status }: { status: FaqStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
      data-testid={`badge-faq-status-${status}`}
    >
      {t(`admin.faqs.statuses.${status}`)}
    </Badge>
  );
}

export function FaqCategoryBadge({
  category,
}: {
  category: FaqCategory | null;
}) {
  const { t } = useLocale();
  if (!category) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <Badge variant="secondary" className="font-normal">
      {t(`admin.faqs.categories.${category}`)}
    </Badge>
  );
}
