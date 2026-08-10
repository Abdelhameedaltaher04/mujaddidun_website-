import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { DonationMethod, DonationStatus } from '@/services/adminDonations';

const STATUS_STYLES: Record<DonationStatus, string> = {
  pending:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  completed:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed:
    'border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  refunded:
    'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  cancelled:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
      data-testid={`badge-donation-status-${status}`}
    >
      {t(`admin.donations.statuses.${status}`)}
    </Badge>
  );
}

export function DonationMethodBadge({ method }: { method: DonationMethod }) {
  const { t } = useLocale();
  return (
    <Badge variant="secondary" className="font-normal">
      {t(`admin.donations.methods.${method}`)}
    </Badge>
  );
}
