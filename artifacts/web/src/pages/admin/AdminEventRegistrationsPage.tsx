import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
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
import {
  RegistrationOpenBadge,
  RegistrationStatusBadge,
} from '@/components/admin/events/eventBadges';
import {
  useAdminEvent,
  useEventRegistrations,
  useRegistrationAction,
} from '@/hooks/useAdminEvents';
import { isRegistrationEffectivelyOpen } from '@/services/adminEvents';
import type {
  EventRegistration,
  RegistrationStatus,
  RegistrationsListParams,
} from '@/services/adminEventRegistrations';

type RegAction = 'confirm' | 'cancel' | 'attended';
type DialogKind = 'view' | RegAction | null;

const ALL = 'all';

/**
 * Registrations management for one event: participant list with search,
 * status filter, stats (total / capacity / remaining), and per-row
 * confirm / cancel / attended actions.
 */
export default function AdminEventRegistrationsPage() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const routeParams = useParams<{ id: string }>();
  const eventId = Number(routeParams.id);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<EventRegistration | null>(null);

  const event = useAdminEvent(Number.isFinite(eventId) ? eventId : null);
  const params = useMemo<RegistrationsListParams>(
    () => ({
      search: search.trim() || undefined,
      status: status !== ALL ? (status as RegistrationStatus) : undefined,
      page,
      per_page: perPage,
    }),
    [search, status, page, perPage],
  );
  const list = useEventRegistrations(eventId, params);
  const action = useRegistrationAction();

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' },
  );

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.events.genericError');

  const runAction = (kind: RegAction) => {
    if (!selected) return;
    action.mutate(
      { id: selected.id, action: kind },
      {
        onSuccess: () => {
          setDialog(null);
          toast({
            description: t(`admin.events.reg.${kind}Success`),
          });
        },
        onError: (error) =>
          toast({ variant: 'destructive', description: errorMessage(error) }),
      },
    );
  };

  const registrations = list.data?.data ?? [];
  const eventTitle = event.data
    ? locale === 'ar'
      ? event.data.title_ar
      : event.data.title_en
    : '';
  const remaining = event.data
    ? Math.max(
        0,
        event.data.max_participants - event.data.registrations_count,
      )
    : 0;

  const openDialog = (kind: Exclude<DialogKind, null>) =>
    (registration: EventRegistration) => {
      setSelected(registration);
      setDialog(kind);
    };

  const confirmCopy: Record<RegAction, { title: string; description: string }> =
    {
      confirm: {
        title: t('admin.events.reg.confirmTitle'),
        description: t('admin.events.reg.confirmDescription'),
      },
      cancel: {
        title: t('admin.events.reg.cancelTitle'),
        description: t('admin.events.reg.cancelDescription'),
      },
      attended: {
        title: t('admin.events.reg.attendedTitle'),
        description: t('admin.events.reg.attendedDescription'),
      },
    };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-testid="link-back-to-events"
          >
            <BackIcon className="h-4 w-4" />
            {t('admin.events.backToList')}
          </Link>
          <h1
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-registrations-title"
          >
            {t('admin.events.reg.title')}
          </h1>
          {eventTitle ? (
            <p className="mt-1 text-muted-foreground">{eventTitle}</p>
          ) : null}
        </div>

        {/* Stats */}
        {event.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card data-testid="stat-total-registrations">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" dir="ltr">
                    {event.data.registrations_count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.events.reg.totalRegistrations')}
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
                    {event.data.max_participants}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.events.reg.availableSeats')}
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
                    {t('admin.events.reg.remainingSeats')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* New-registrations availability notice */}
        {event.data ? (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
            data-testid="notice-registration-availability"
          >
            <RegistrationOpenBadge event={event.data} />
            <span className="text-muted-foreground">
              {isRegistrationEffectivelyOpen(event.data)
                ? t('admin.events.reg.acceptingNotice')
                : t('admin.events.reg.closedNotice')}
            </span>
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
              placeholder={t('admin.events.reg.searchPlaceholder')}
              className="ps-9"
              data-testid="input-registrations-search"
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
              <SelectTrigger data-testid="select-registrations-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('admin.events.allStatuses')}
                </SelectItem>
                {(
                  ['pending', 'confirmed', 'cancelled', 'attended'] as const
                ).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`admin.events.regStatuses.${value}`)}
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
                data-testid="button-clear-registration-filters"
              >
                <X className="me-1 h-4 w-4" />
                {t('admin.events.clearFilters')}
              </Button>
            ) : null}
          </div>
        </div>

        {list.isPending ? (
          <div className="space-y-3" data-testid="registrations-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="registrations-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button variant="outline" onClick={() => list.refetch()}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.events.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : registrations.length === 0 ? (
          <Card data-testid="registrations-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {t('admin.events.reg.emptyState')}
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
                    <TableHead>{t('admin.events.reg.participant')}</TableHead>
                    <TableHead>{t('admin.events.reg.email')}</TableHead>
                    <TableHead>{t('admin.events.reg.phone')}</TableHead>
                    <TableHead>{t('admin.events.reg.registeredAt')}</TableHead>
                    <TableHead>{t('admin.events.reg.status')}</TableHead>
                    <TableHead className="w-12 text-end">
                      {t('admin.events.columns.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow
                      key={registration.id}
                      data-testid={`row-registration-${registration.id}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {registration.participant_name}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {registration.email}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {registration.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dateFormatter.format(
                          new Date(registration.registered_at),
                        )}
                      </TableCell>
                      <TableCell>
                        <RegistrationStatusBadge
                          status={registration.status}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <RegistrationActionsMenu
                          registration={registration}
                          onView={openDialog('view')}
                          onConfirm={openDialog('confirm')}
                          onCancel={openDialog('cancel')}
                          onAttended={openDialog('attended')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {registrations.map((registration) => (
                <Card
                  key={registration.id}
                  data-testid={`card-registration-${registration.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {registration.participant_name}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          {registration.email}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {registration.phone}
                        </p>
                      </div>
                      <RegistrationActionsMenu
                        registration={registration}
                        onView={openDialog('view')}
                        onConfirm={openDialog('confirm')}
                        onCancel={openDialog('cancel')}
                        onAttended={openDialog('attended')}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <RegistrationStatusBadge status={registration.status} />
                      <span className="text-xs text-muted-foreground">
                        {dateFormatter.format(
                          new Date(registration.registered_at),
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {list.data && registrations.length > 0 ? (
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
          data-testid="dialog-registration-details"
        >
          <DialogHeader>
            <DialogTitle>{t('admin.events.reg.detailsTitle')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('admin.events.reg.detailsTitle')}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.events.reg.participant')}
                </span>
                <span className="font-medium text-foreground">
                  {selected.participant_name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.events.reg.email')}
                </span>
                <span dir="ltr">{selected.email}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.events.reg.phone')}
                </span>
                <span dir="ltr">{selected.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.events.reg.registeredAt')}
                </span>
                <span>
                  {dateFormatter.format(new Date(selected.registered_at))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t('admin.events.reg.status')}
                </span>
                <RegistrationStatusBadge status={selected.status} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Action confirmations */}
      {(['confirm', 'cancel', 'attended'] as const).map((kind) => (
        <AlertDialog
          key={kind}
          open={dialog === kind}
          onOpenChange={(open) => !open && setDialog(null)}
        >
          <AlertDialogContent data-testid={`dialog-registration-${kind}`}>
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
                {t('admin.events.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  runAction(kind);
                }}
                disabled={action.isPending}
                className={
                  kind === 'cancel'
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : undefined
                }
                data-testid={`dialog-registration-${kind}-confirm`}
              >
                {t(`admin.events.reg.${kind}Action`)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </AdminLayout>
  );
}

function RegistrationActionsMenu({
  registration,
  onView,
  onConfirm,
  onCancel,
  onAttended,
}: {
  registration: EventRegistration;
  onView: (r: EventRegistration) => void;
  onConfirm: (r: EventRegistration) => void;
  onCancel: (r: EventRegistration) => void;
  onAttended: (r: EventRegistration) => void;
}) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-registration-actions-${registration.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.events.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onView(registration)}
          data-testid={`registration-action-view-${registration.id}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.events.actionView')}
        </DropdownMenuItem>
        {registration.status === 'pending' ? (
          <DropdownMenuItem
            onClick={() => onConfirm(registration)}
            data-testid={`registration-action-confirm-${registration.id}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.events.reg.confirmAction')}
          </DropdownMenuItem>
        ) : null}
        {registration.status === 'confirmed' ||
        registration.status === 'pending' ? (
          <DropdownMenuItem
            onClick={() => onAttended(registration)}
            data-testid={`registration-action-attended-${registration.id}`}
          >
            <UserCheck className="me-2 h-4 w-4" />
            {t('admin.events.reg.attendedAction')}
          </DropdownMenuItem>
        ) : null}
        {registration.status !== 'cancelled' &&
        registration.status !== 'attended' ? (
          <DropdownMenuItem
            onClick={() => onCancel(registration)}
            className="text-destructive focus:text-destructive"
            data-testid={`registration-action-cancel-${registration.id}`}
          >
            <Ban className="me-2 h-4 w-4" />
            {t('admin.events.reg.cancelAction')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
