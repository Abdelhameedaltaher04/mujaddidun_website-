import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ParticipantStatusBadge } from '@/components/admin/programs/programBadges';
import {
  useAdminProgram,
  useParticipantAction,
  useProgramParticipants,
  type ParticipantAction,
} from '@/hooks/useAdminPrograms';
import {
  PARTICIPANT_STATUSES,
  type ParticipantStatus,
  type ParticipantsListParams,
  type ProgramParticipant,
} from '@/services/adminProgramParticipants';

type DialogKind = 'view' | ParticipantAction | null;

const ALL = 'all';

/**
 * Participants management for one program: list with search, status
 * filter, stats (total / capacity / remaining), and per-row
 * approve / reject actions.
 */
export default function AdminProgramParticipantsPage() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const routeParams = useParams<{ id: string }>();
  const programId = Number(routeParams.id);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<ProgramParticipant | null>(null);

  const program = useAdminProgram(
    Number.isFinite(programId) ? programId : null,
  );
  const params = useMemo<ParticipantsListParams>(
    () => ({
      search: search.trim() || undefined,
      status: status !== ALL ? (status as ParticipantStatus) : undefined,
      page,
      per_page: perPage,
    }),
    [search, status, page, perPage],
  );
  const list = useProgramParticipants(programId, params);
  const action = useParticipantAction();

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' },
  );

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.programs.genericError');

  const runAction = (kind: ParticipantAction) => {
    if (!selected) return;
    action.mutate(
      { id: selected.id, action: kind },
      {
        onSuccess: () => {
          setDialog(null);
          toast({ description: t(`admin.programs.part.${kind}Success`) });
        },
        onError: (error) =>
          toast({ variant: 'destructive', description: errorMessage(error) }),
      },
    );
  };

  const participants = list.data?.data ?? [];
  const programTitle = program.data
    ? locale === 'ar'
      ? program.data.title_ar
      : program.data.title_en
    : '';
  const remaining = program.data
    ? Math.max(
        0,
        program.data.max_participants - program.data.participants_count,
      )
    : 0;

  const openDialog =
    (kind: Exclude<DialogKind, null>) => (row: ProgramParticipant) => {
      setSelected(row);
      setDialog(kind);
    };

  const confirmCopy: Record<
    ParticipantAction,
    { title: string; description: string }
  > = {
    approve: {
      title: t('admin.programs.part.approveTitle'),
      description: t('admin.programs.part.approveDescription'),
    },
    reject: {
      title: t('admin.programs.part.rejectTitle'),
      description: t('admin.programs.part.rejectDescription'),
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-testid="link-back-to-programs"
          >
            <BackIcon className="h-4 w-4" />
            {t('admin.programs.backToList')}
          </Link>
          <h1
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-participants-title"
          >
            {t('admin.programs.part.title')}
          </h1>
          {programTitle ? (
            <p className="mt-1 text-muted-foreground">{programTitle}</p>
          ) : null}
        </div>

        {/* Stats */}
        {program.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card data-testid="stat-total-participants">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" dir="ltr">
                    {program.data.participants_count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.programs.part.totalParticipants')}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-available-seats">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" dir="ltr">
                    {program.data.max_participants}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.programs.part.availableSeats')}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-remaining-seats">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" dir="ltr">
                    {remaining}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.programs.part.remainingSeats')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Search + status filter */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('admin.programs.part.searchPlaceholder')}
              className="ps-9"
              data-testid="input-participants-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="select-participants-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('admin.programs.allStatuses')}
                </SelectItem>
                {PARTICIPANT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`admin.programs.participantStatuses.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {search || status !== ALL ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus(ALL);
                  setPage(1);
                }}
                data-testid="button-clear-participant-filters"
              >
                <X className="me-1 h-4 w-4" />
                {t('admin.programs.clearFilters')}
              </Button>
            ) : null}
          </div>
        </div>

        {list.isPending ? (
          <div className="space-y-3" data-testid="participants-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="participants-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button variant="outline" onClick={() => list.refetch()}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.programs.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : participants.length === 0 ? (
          <Card data-testid="participants-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {t('admin.programs.part.emptyState')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              list.isFetching ? 'pointer-events-none opacity-60' : undefined
            }
          >
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('admin.programs.part.participant')}
                    </TableHead>
                    <TableHead>{t('admin.programs.part.email')}</TableHead>
                    <TableHead>{t('admin.programs.part.phone')}</TableHead>
                    <TableHead>
                      {t('admin.programs.part.registeredAt')}
                    </TableHead>
                    <TableHead>{t('admin.programs.part.status')}</TableHead>
                    <TableHead className="w-12 text-end">
                      {t('admin.programs.columns.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((row) => (
                    <TableRow
                      key={row.id}
                      data-testid={`row-participant-${row.id}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {row.participant_name}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {row.email}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {row.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dateFormatter.format(new Date(row.registered_at))}
                      </TableCell>
                      <TableCell>
                        <ParticipantStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-end">
                        <ParticipantActionsMenu
                          participant={row}
                          variant="desktop"
                          onView={openDialog('view')}
                          onApprove={openDialog('approve')}
                          onReject={openDialog('reject')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {participants.map((row) => (
                <Card key={row.id} data-testid={`card-participant-${row.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {row.participant_name}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          {row.email}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {row.phone}
                        </p>
                      </div>
                      <ParticipantActionsMenu
                        participant={row}
                        variant="mobile"
                        onView={openDialog('view')}
                        onApprove={openDialog('approve')}
                        onReject={openDialog('reject')}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <ParticipantStatusBadge status={row.status} />
                      <span className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(row.registered_at))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {list.data && participants.length > 0 ? (
          <AdminPagination
            meta={list.data.meta}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />
        ) : null}
      </div>

      {/* Participant details */}
      <Dialog
        open={dialog === 'view'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent
          className="sm:max-w-md"
          data-testid="dialog-participant-details"
        >
          <DialogHeader>
            <DialogTitle>{t('admin.programs.part.detailsTitle')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('admin.programs.part.detailsTitle')}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.programs.part.participant')}
                </span>
                <span className="font-medium text-foreground">
                  {selected.participant_name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.programs.part.email')}
                </span>
                <span dir="ltr">{selected.email}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.programs.part.phone')}
                </span>
                <span dir="ltr">{selected.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.programs.part.registeredAt')}
                </span>
                <span>
                  {dateFormatter.format(new Date(selected.registered_at))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.programs.part.status')}
                </span>
                <ParticipantStatusBadge status={selected.status} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Action confirmations */}
      {(['approve', 'reject'] as const).map((kind) => (
        <AlertDialog
          key={kind}
          open={dialog === kind}
          onOpenChange={(open) => !open && setDialog(null)}
        >
          <AlertDialogContent data-testid={`dialog-participant-${kind}`}>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmCopy[kind].title}</AlertDialogTitle>
              <AlertDialogDescription>
                {selected
                  ? `${confirmCopy[kind].description} (${selected.participant_name})`
                  : confirmCopy[kind].description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={action.isPending}>
                {t('admin.programs.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  runAction(kind);
                }}
                disabled={action.isPending}
                className={
                  kind === 'reject'
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : undefined
                }
                data-testid={`dialog-participant-${kind}-confirm`}
              >
                {t(`admin.programs.part.${kind}Action`)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </AdminLayout>
  );
}

function ParticipantActionsMenu({
  participant,
  variant,
  onView,
  onApprove,
  onReject,
}: {
  participant: ProgramParticipant;
  /** Distinguishes the desktop-table vs mobile-card render paths so
   * test ids stay unique on the page. */
  variant: 'desktop' | 'mobile';
  onView: (r: ProgramParticipant) => void;
  onApprove: (r: ProgramParticipant) => void;
  onReject: (r: ProgramParticipant) => void;
}) {
  const { t } = useLocale();
  const suffix = variant === 'mobile' ? '-mobile' : '';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-participant-actions-${participant.id}${suffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.programs.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onView(participant)}
          data-testid={`participant-action-view-${participant.id}${suffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.programs.actionView')}
        </DropdownMenuItem>
        {participant.status === 'pending' ||
        participant.status === 'rejected' ? (
          <DropdownMenuItem
            onClick={() => onApprove(participant)}
            data-testid={`participant-action-approve-${participant.id}${suffix}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.programs.part.approveAction')}
          </DropdownMenuItem>
        ) : null}
        {participant.status === 'pending' ||
        participant.status === 'approved' ? (
          <DropdownMenuItem
            onClick={() => onReject(participant)}
            className="text-destructive focus:text-destructive"
            data-testid={`participant-action-reject-${participant.id}${suffix}`}
          >
            <XCircle className="me-2 h-4 w-4" />
            {t('admin.programs.part.rejectAction')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
