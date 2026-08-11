import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicEventsApi, type PublicEventStatus } from '@/services/publicEvents';

export function usePublicEventsList(page: number, statuses: PublicEventStatus[]) {
  return useQuery({
    queryKey: ['public-events', statuses.join(','), page],
    queryFn: () => publicEventsApi.list(page, statuses),
    retry: 1,
  });
}

export function usePublicEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['public-event', id],
    queryFn: () => publicEventsApi.get(id as string),
    enabled: !!id && /^\d+$/.test(id),
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => publicEventsApi.register(eventId),
    onSettled: () => {
      // Refresh both list and detail so is_registered / counts update.
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      queryClient.invalidateQueries({ queryKey: ['public-event'] });
    },
  });
}
