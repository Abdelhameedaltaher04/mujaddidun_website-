import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  EventForm,
  type EventFormErrors,
} from '@/components/admin/events/EventForm';
import {
  useAdminEvent,
  useCreateEvent,
  useUpdateEvent,
} from '@/hooks/useAdminEvents';
import type { EventInput } from '@/services/adminEvents';

/**
 * Create (/admin/events/new) and edit (/admin/events/:id/edit) page —
 * both render the same reusable EventForm.
 */
export default function AdminEventFormPage() {
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const routeParams = useParams<{ id?: string }>();
  const editId = routeParams.id ? Number(routeParams.id) : null;
  const isEdit = editId !== null && Number.isFinite(editId);

  const event = useAdminEvent(isEdit ? editId : null);
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const [serverErrors, setServerErrors] = useState<EventFormErrors>({});

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const isSaving = create.isPending || update.isPending;

  const handleSubmit = (input: EventInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      /** Laravel 422 responses land under the matching fields. */
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.events.genericError'),
      });
    };
    const onSuccess = () => {
      toast({
        description:
          input.status === 'draft'
            ? t('admin.events.savedDraftSuccess')
            : t('admin.events.publishedSuccess'),
      });
      navigate('/admin/events');
    };
    if (isEdit && editId) {
      update.mutate({ id: editId, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
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
            data-testid="text-event-form-title"
          >
            {isEdit ? t('admin.events.editEvent') : t('admin.events.addEvent')}
          </h1>
        </div>

        {isEdit && event.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : isEdit && event.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {getApiError(event.error).message ||
                  t('admin.events.genericError')}
              </p>
              <Button variant="outline" onClick={() => event.refetch()}>
                {t('admin.events.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EventForm
            key={isEdit ? editId : 'new'}
            event={isEdit ? event.data ?? null : null}
            isSaving={isSaving}
            serverErrors={serverErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/events')}
          />
        )}
      </div>
    </AdminLayout>
  );
}
