import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/services/adminVolunteers';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  under_review:
    'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  approved:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected:
    'border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  withdrawn:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
      data-testid={`badge-application-status-${status}`}
    >
      {t(`admin.volunteers.statuses.${status}`)}
    </Badge>
  );
}
