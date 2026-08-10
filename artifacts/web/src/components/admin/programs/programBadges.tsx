import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { ProgramCategory, ProgramStatus } from '@/services/adminPrograms';
import type { ParticipantStatus } from '@/services/adminProgramParticipants';

const PROGRAM_STATUS_STYLES: Record<ProgramStatus, string> = {
  draft:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', PROGRAM_STATUS_STYLES[status])}
    >
      {t(`admin.programs.statuses.${status}`)}
    </Badge>
  );
}

export function ProgramCategoryBadge({
  category,
}: {
  category: ProgramCategory;
}) {
  const { t } = useLocale();
  return (
    <Badge variant="outline" className="font-medium bg-secondary/10 text-secondary-foreground border-border">
      {t(`admin.programs.categories.${category}`)}
    </Badge>
  );
}

const PARTICIPANT_STATUS_STYLES: Record<ParticipantStatus, string> = {
  pending:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
};

export function ParticipantStatusBadge({
  status,
}: {
  status: ParticipantStatus;
}) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', PARTICIPANT_STATUS_STYLES[status])}
    >
      {t(`admin.programs.participantStatuses.${status}`)}
    </Badge>
  );
}
