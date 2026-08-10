import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { PartnerStatus, PartnerType } from '@/services/adminPartners';

const STATUS_STYLES: Record<PartnerStatus, string> = {
  active:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
      data-testid={`badge-partner-status-${status}`}
    >
      {t(`admin.partners.statuses.${status}`)}
    </Badge>
  );
}

export function PartnerTypeBadge({ type }: { type: PartnerType }) {
  const { t } = useLocale();
  return (
    <Badge variant="secondary" className="font-normal">
      {t(`admin.partners.types.${type}`)}
    </Badge>
  );
}
