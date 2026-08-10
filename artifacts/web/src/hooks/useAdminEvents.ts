import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminEventsApi,
  type EventInput,
  type EventsListParams,
} from '@/services/adminEvents';
import {
  adminEventRegistrationsApi,
  type RegistrationsListParams,
} from '@/services/adminEventRegistrations';

const EVENTS_KEY = ['admin', 'events'] as const;

export function useAdminEventsList(params: EventsListParams) {
  return useQuery({
    queryKey: [...EVENTS_KEY, 'list', params],
    queryFn: () => adminEventsApi.listEvents(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminEvent(id: number | null) {
  return useQuery({
    queryKey: [...EVENTS_KEY, 'detail', id],
    queryFn: () => adminEventsApi.getEvent(id as number),
    enabled: id !== null,
  });
}

function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (input: EventInput) => adminEventsApi.createEvent(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EventInput }) =>
      adminEventsApi.updateEvent(id, input),
    onSuccess: invalidate,
  });
}

export function useSetEventPublished() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      adminEventsApi.setPublished(id, publish),
    onSuccess: invalidate,
  });
}

export function useCancelEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id: number) => adminEventsApi.cancelEvent(id),
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id: number) => adminEventsApi.deleteEvent(id),
    onSuccess: invalidate,
  });
}

/* ------------------------- Registrations ------------------------- */

export function useEventRegistrations(
  eventId: number,
  params: RegistrationsListParams,
) {
  return useQuery({
    queryKey: [...EVENTS_KEY, 'registrations', eventId, params],
    queryFn: () =>
      adminEventRegistrationsApi.listRegistrations(eventId, params),
    placeholderData: keepPreviousData,
  });
}

type RegistrationAction = 'confirm' | 'cancel' | 'attended';

export function useRegistrationAction() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number;
      action: RegistrationAction;
    }) => {
      if (action === 'confirm')
        return adminEventRegistrationsApi.confirmRegistration(id);
      if (action === 'cancel')
        return adminEventRegistrationsApi.cancelRegistration(id);
      return adminEventRegistrationsApi.markAttended(id);
    },
    onSuccess: invalidate,
  });
}
