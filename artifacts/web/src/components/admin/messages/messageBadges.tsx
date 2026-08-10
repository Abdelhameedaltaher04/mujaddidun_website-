import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { MessageStatus } from '@/services/adminMessages';

const STATUS_STYLES: Record<MessageStatus, string> = {
  new: 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  in_progress:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  resolved:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
      data-testid={`badge-message-status-${status}`}
    >
      {t(`admin.messages.statuses.${status}`)}
    </Badge>
  );
}
