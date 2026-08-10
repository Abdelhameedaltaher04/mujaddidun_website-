import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminVolunteersApi,
  type ApplicationsListParams,
  type StatusChangeInput,
} from '@/services/adminVolunteers';

const KEY_PREFIX = ['admin', 'volunteers'] as const;

export function useAdminApplicationsList(params: ApplicationsListParams) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'list', params],
    queryFn: () => adminVolunteersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useApplicationStatistics() {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'statistics'],
    queryFn: () => adminVolunteersApi.statistics(),
  });
}

export function useVolunteerPrograms() {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'programs'],
    queryFn: () => adminVolunteersApi.programs(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminApplication(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'detail', id],
    queryFn: () => adminVolunteersApi.get(id as number),
    enabled: id !== null,
  });
}

export function useApplicationNotes(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'notes', id],
    queryFn: () => adminVolunteersApi.notes(id as number),
    enabled: id !== null,
  });
}

export function useApplicationDocuments(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'documents', id],
    queryFn: () => adminVolunteersApi.documents(id as number),
    enabled: id !== null,
  });
}

function useInvalidateVolunteers() {
  const queryClient = useQueryClient();
  // Fire-and-forget so the mutation settles immediately (dialogs close
  // without waiting on the refetch round-trip).
  return () => {
    void queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
  };
}

export function useApplicationStatusAction() {
  const invalidate = useInvalidateVolunteers();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StatusChangeInput }) =>
      adminVolunteersApi.setStatus(id, input),
    onSuccess: invalidate,
  });
}

export function useAddApplicationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      adminVolunteersApi.addNote(id, body),
    onSuccess: (_note, { id }) =>
      queryClient.invalidateQueries({ queryKey: [...KEY_PREFIX, 'notes', id] }),
  });
}
