import {
  Ban,
  CalendarX2,
  ClipboardList,
  Eye,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminEvent } from '@/services/adminEvents';
import {
  EventStatusBadge,
  RegistrationOpenBadge,
} from './eventBadges';

function Thumb({ event }: { event: AdminEvent }) {
  return event.image_url ? (
    <img
      src={event.image_url}
      alt=""
      className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
    />
  ) : (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageOff className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export interface EventRowActions {
  onView: (event: AdminEvent) => void;
  onEdit: (event: AdminEvent) => void;
  onPublishToggle: (event: AdminEvent) => void;
  onCancel: (event: AdminEvent) => void;
  onRegistrations: (event: AdminEvent) => void;
  onDelete: (event: AdminEvent) => void;
}

function RowActionsMenu({
  event,
  actions,
}: {
  event: AdminEvent;
  actions: EventRowActions;
}) {
  const { t } = useLocale();
  const canPublish = event.status === 'draft';
  const canUnpublish = event.status === 'upcoming';
  const canCancel =
    event.status !== 'cancelled' && event.status !== 'completed';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-event-actions-${event.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.events.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(event)}
          data-testid={`event-action-view-${event.id}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.events.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(event)}
          data-testid={`event-action-edit-${event.id}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.events.actionEdit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onRegistrations(event)}
          data-testid={`event-action-registrations-${event.id}`}
        >
          <ClipboardList className="me-2 h-4 w-4" />
          {t('admin.events.actionRegistrations')}
        </DropdownMenuItem>
        {canPublish ? (
          <DropdownMenuItem
            onClick={() => actions.onPublishToggle(event)}
            data-testid={`event-action-publish-${event.id}`}
          >
            <Send className="me-2 h-4 w-4" />
            {t('admin.events.actionPublish')}
          </DropdownMenuItem>
        ) : null}
        {canUnpublish ? (
          <DropdownMenuItem
            onClick={() => actions.onPublishToggle(event)}
            data-testid={`event-action-unpublish-${event.id}`}
          >
            <Undo2 className="me-2 h-4 w-4" />
            {t('admin.events.actionUnpublish')}
          </DropdownMenuItem>
        ) : null}
        {canCancel ? (
          <DropdownMenuItem
            onClick={() => actions.onCancel(event)}
            data-testid={`event-action-cancel-${event.id}`}
          >
            <Ban className="me-2 h-4 w-4" />
            {t('admin.events.actionCancel')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(event)}
          className="text-destructive focus:text-destructive"
          data-testid={`event-action-delete-${event.id}`}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {t('admin.events.actionDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface EventsTableProps extends EventRowActions {
  events: AdminEvent[];
}

/** Events list: table on lg+ screens, stacked cards below. */
export function EventsTable({ events, ...actions }: EventsTableProps) {
  const { t, locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium' },
  );
  const timeFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { hour: 'numeric', minute: '2-digit' },
  );
  const formatDate = (iso: string | null) =>
    iso ? dateFormatter.format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : '—';
  const formatTime = (time: string) =>
    timeFormatter.format(new Date(`2026-01-01T${time}:00`));
  const primaryTitle = (e: AdminEvent) =>
    locale === 'ar' ? e.title_ar : e.title_en;
  const secondaryTitle = (e: AdminEvent) =>
    locale === 'ar' ? e.title_en : e.title_ar;
  const location = (e: AdminEvent) =>
    locale === 'ar' ? e.location_ar : e.location_en;

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.events.columns.event')}</TableHead>
              <TableHead>{t('admin.events.columns.location')}</TableHead>
              <TableHead>{t('admin.events.columns.dateTime')}</TableHead>
              <TableHead>{t('admin.events.columns.registration')}</TableHead>
              <TableHead>{t('admin.events.columns.status')}</TableHead>
              <TableHead>{t('admin.events.columns.registrations')}</TableHead>
              <TableHead>{t('admin.events.columns.createdAt')}</TableHead>
              <TableHead className="w-12 text-end">
                {t('admin.events.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer"
                onClick={() => actions.onView(event)}
                data-testid={`row-event-${event.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumb event={event} />
                    <div className="min-w-0 max-w-56">
                      <p className="truncate font-medium text-foreground">
                        {primaryTitle(event)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {secondaryTitle(event)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                  {location(event)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{formatDate(event.event_date)}</div>
                  <div className="text-xs" dir="ltr">
                    {formatTime(event.start_time)} –{' '}
                    {formatTime(event.end_time)}
                  </div>
                </TableCell>
                <TableCell>
                  <RegistrationOpenBadge event={event} />
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span dir="ltr">
                    {event.registrations_count}/{event.max_participants}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(event.created_at)}
                </TableCell>
                <TableCell
                  className="text-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu event={event} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {events.map((event) => (
          <Card key={event.id} data-testid={`card-event-${event.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 text-start"
                  onClick={() => actions.onView(event)}
                >
                  <Thumb event={event} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {primaryTitle(event)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {location(event)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(event.event_date)} ·{' '}
                      <span dir="ltr">
                        {formatTime(event.start_time)}–
                        {formatTime(event.end_time)}
                      </span>
                    </p>
                  </div>
                </button>
                <RowActionsMenu event={event} actions={actions} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EventStatusBadge status={event.status} />
                <RegistrationOpenBadge event={event} />
                <span className="ms-auto text-xs text-muted-foreground" dir="ltr">
                  {event.registrations_count}/{event.max_participants}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
