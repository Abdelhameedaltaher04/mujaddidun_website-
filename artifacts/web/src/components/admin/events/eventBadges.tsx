import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import {
  isRegistrationEffectivelyOpen,
  type AdminEvent,
  type EventStatus,
} from '@/services/adminEvents';
import type { RegistrationStatus } from '@/services/adminEventRegistrations';

const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  draft:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  upcoming: 'bg-primary/10 text-primary border-primary/20',
  ongoing: 'bg-success/10 text-success border-success/20',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', EVENT_STATUS_STYLES[status])}
    >
      {t(`admin.events.statuses.${status}`)}
    </Badge>
  );
}

/**
 * Shows whether the event currently accepts new registrations —
 * closed switch, cancelled/completed event, or a full house all close it.
 */
export function RegistrationOpenBadge({ event }: { event: AdminEvent }) {
  const { t } = useLocale();
  const open = isRegistrationEffectivelyOpen(event);
  const full = event.registrations_count >= event.max_participants;
  const label = open
    ? t('admin.events.registrationOpen')
    : full && event.registration_status === 'open'
      ? t('admin.events.registrationFull')
      : t('admin.events.registrationClosed');
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        open
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-muted text-muted-foreground border-border',
      )}
    >
      {label}
    </Badge>
  );
}

const REG_STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  attended: 'bg-success/10 text-success border-success/20',
};

export function RegistrationStatusBadge({
  status,
}: {
  status: RegistrationStatus;
}) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', REG_STATUS_STYLES[status])}
    >
      {t(`admin.events.regStatuses.${status}`)}
    </Badge>
  );
}
