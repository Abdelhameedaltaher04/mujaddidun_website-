import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  EMPTY_EVENTS_FILTERS,
  EventsFilters,
  type EventsFiltersValue,
} from '@/components/admin/events/EventsFilters';
import { EventsTable } from '@/components/admin/events/EventsTable';
import { EventPreviewDialog } from '@/components/admin/events/EventPreviewDialog';
import {
  EventCancelConfirmDialog,
  EventDeleteConfirmDialog,
  EventPublishConfirmDialog,
} from '@/components/admin/events/EventsConfirmDialogs';
import {
  useAdminEventsList,
  useCancelEvent,
  useDeleteEvent,
  useSetEventPublished,
} from '@/hooks/useAdminEvents';
import type {
  AdminEvent,
  EventStatus,
  EventsListParams,
  RegistrationOpenStatus,
} from '@/services/adminEvents';

type DialogKind = 'view' | 'publish' | 'cancel' | 'delete' | null;

/** Events management list: search/filter, paginate, preview, act. */
export default function AdminEventsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<EventsFiltersValue>(
    EMPTY_EVENTS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<AdminEvent | null>(null);

  const params = useMemo<EventsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      status:
        filters.status !== 'all' ? (filters.status as EventStatus) : undefined,
      registration_status:
        filters.registrationStatus !== 'all'
          ? (filters.registrationStatus as RegistrationOpenStatus)
          : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      location: filters.location.trim() || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminEventsList(params);
  const setPublished = useSetEventPublished();
  const cancelEvent = useCancelEvent();
  const remove = useDeleteEvent();

  const openDialog =
    (kind: Exclude<DialogKind, null>) => (event: AdminEvent) => {
      setSelected(event);
      setDialog(kind);
    };
  const closeDialog = () => setDialog(null);

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.events.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: EventsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const events = list.data?.data ?? [];
  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_EVENTS_FILTERS);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-events-title"
            >
              {t('admin.events.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.events.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/events/new')}
            data-testid="button-add-event"
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('admin.events.addEvent')}
          </Button>
        </div>

        <EventsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="events-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="events-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-events"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.events.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card data-testid="events-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.events.noResults')
                  : t('admin.events.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_EVENTS_FILTERS)}
                >
                  {t('admin.events.clearFilters')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/events/new')}
                >
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.events.addEvent')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              list.isFetching ? 'pointer-events-none opacity-60' : undefined
            }
          >
            <EventsTable
              events={events}
              onView={openDialog('view')}
              onEdit={(event) => navigate(`/admin/events/${event.id}/edit`)}
              onRegistrations={(event) =>
                navigate(`/admin/events/${event.id}/registrations`)
              }
              onPublishToggle={openDialog('publish')}
              onCancel={openDialog('cancel')}
              onDelete={openDialog('delete')}
            />
          </div>
        )}

        {list.data && events.length > 0 ? (
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

      <EventPreviewDialog
        event={selected}
        open={dialog === 'view'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <EventPublishConfirmDialog
        event={selected}
        open={dialog === 'publish'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={setPublished.isPending}
        onConfirm={() => {
          if (!selected) return;
          const publish = selected.status === 'draft';
          setPublished.mutate(
            { id: selected.id, publish },
            {
              onSuccess: () => {
                closeDialog();
                toast({
                  description: publish
                    ? t('admin.events.publishedSuccess')
                    : t('admin.events.unpublishedSuccess'),
                });
              },
              onError: notifyError,
            },
          );
        }}
      />
      <EventCancelConfirmDialog
        event={selected}
        open={dialog === 'cancel'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={cancelEvent.isPending}
        onConfirm={() => {
          if (!selected) return;
          cancelEvent.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.events.cancelledSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
      <EventDeleteConfirmDialog
        event={selected}
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.events.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
