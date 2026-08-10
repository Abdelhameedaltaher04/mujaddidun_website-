import {
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  SearchCheck,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale } from '@/contexts/LocaleContext';
import type { VolunteerApplication } from '@/services/adminVolunteers';
import { ApplicationStatusBadge } from '@/components/admin/volunteers/volunteerBadges';
import {
  canApprove,
  canReject,
  canReview,
  canWithdraw,
} from '@/components/admin/volunteers/volunteerTransitions';

export interface ApplicationActions {
  onView: (application: VolunteerApplication) => void;
  onMarkUnderReview: (application: VolunteerApplication) => void;
  onApprove: (application: VolunteerApplication) => void;
  onReject: (application: VolunteerApplication) => void;
  onWithdraw: (application: VolunteerApplication) => void;
}

interface VolunteersTableProps extends ApplicationActions {
  applications: VolunteerApplication[];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}

function SkillsBadges({ skills }: { skills: string[] }) {
  const shown = skills.slice(0, 2);
  const rest = skills.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((skill) => (
        <Badge key={skill} variant="secondary" className="font-normal">
          {skill}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="outline" className="font-normal" dir="ltr">
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}

function ActionsMenu({
  application,
  actions,
  idSuffix = '',
}: {
  application: VolunteerApplication;
  actions: ApplicationActions;
  idSuffix?: string;
}) {
  const { t } = useLocale();
  const showReview = canReview(application.status);
  const showApprove = canApprove(application.status);
  const showReject = canReject(application.status);
  const showWithdraw = canWithdraw(application.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-application-actions-${application.id}${idSuffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.volunteers.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(application)}
          data-testid={`application-action-view-${application.id}${idSuffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.volunteers.actionView')}
        </DropdownMenuItem>
        {showReview ? (
          <DropdownMenuItem
            onClick={() => actions.onMarkUnderReview(application)}
            data-testid={`application-action-review-${application.id}${idSuffix}`}
          >
            <SearchCheck className="me-2 h-4 w-4" />
            {t('admin.volunteers.actionMarkUnderReview')}
          </DropdownMenuItem>
        ) : null}
        {showApprove ? (
          <DropdownMenuItem
            onClick={() => actions.onApprove(application)}
            data-testid={`application-action-approve-${application.id}${idSuffix}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.volunteers.actionApprove')}
          </DropdownMenuItem>
        ) : null}
        {showReject || showWithdraw ? <DropdownMenuSeparator /> : null}
        {showReject ? (
          <DropdownMenuItem
            onClick={() => actions.onReject(application)}
            className="text-destructive focus:text-destructive"
            data-testid={`application-action-reject-${application.id}${idSuffix}`}
          >
            <XCircle className="me-2 h-4 w-4" />
            {t('admin.volunteers.actionReject')}
          </DropdownMenuItem>
        ) : null}
        {showWithdraw ? (
          <DropdownMenuItem
            onClick={() => actions.onWithdraw(application)}
            className="text-destructive focus:text-destructive"
            data-testid={`application-action-withdraw-${application.id}${idSuffix}`}
          >
            <Ban className="me-2 h-4 w-4" />
            {t('admin.volunteers.actionWithdraw')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop table (lg+) and mobile/tablet cards for volunteer applications. */
export function VolunteersTable({
  applications,
  ...actions
}: VolunteersTableProps) {
  const { t, locale } = useLocale();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.volunteers.columnApplicant')}</TableHead>
              <TableHead>{t('admin.volunteers.columnPhone')}</TableHead>
              <TableHead>{t('admin.volunteers.columnProgram')}</TableHead>
              <TableHead>{t('admin.volunteers.columnSkills')}</TableHead>
              <TableHead>{t('admin.volunteers.columnDate')}</TableHead>
              <TableHead>{t('admin.volunteers.columnStatus')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow
                key={application.id}
                data-testid={`row-application-${application.id}`}
              >
                <TableCell className="max-w-[240px]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage
                        src={application.avatar_url ?? undefined}
                        alt={application.full_name}
                      />
                      <AvatarFallback>
                        {initials(application.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {application.full_name}
                      </p>
                      <p
                        className="truncate text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {application.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  <span dir="ltr">{application.phone ?? '—'}</span>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="truncate text-sm">
                    {application.program
                      ? locale === 'ar'
                        ? application.program.title_ar
                        : application.program.title_en
                      : '—'}
                  </p>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <SkillsBadges skills={application.skills} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(application.applied_at)}
                </TableCell>
                <TableCell>
                  <ApplicationStatusBadge status={application.status} />
                </TableCell>
                <TableCell>
                  <ActionsMenu application={application} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet */}
      <div className="space-y-3 lg:hidden">
        {applications.map((application) => (
          <Card
            key={application.id}
            data-testid={`card-application-${application.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={application.avatar_url ?? undefined}
                      alt={application.full_name}
                    />
                    <AvatarFallback>
                      {initials(application.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {application.full_name}
                    </p>
                    <p
                      className="truncate text-sm text-muted-foreground"
                      dir="ltr"
                    >
                      {application.email}
                    </p>
                  </div>
                </div>
                <ActionsMenu
                  application={application}
                  actions={actions}
                  idSuffix="-mobile"
                />
              </div>
              <div className="mt-3 space-y-2">
                <SkillsBadges skills={application.skills} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="text-muted-foreground">
                    {formatDate(application.applied_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
