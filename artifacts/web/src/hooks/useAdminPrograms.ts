import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminProgramsApi,
  type ProgramInput,
  type ProgramsListParams,
} from '@/services/adminPrograms';
import {
  adminProgramParticipantsApi,
  type ParticipantsListParams,
} from '@/services/adminProgramParticipants';

const PROGRAMS_KEY = ['admin', 'programs'] as const;

export function useAdminProgramsList(params: ProgramsListParams) {
  return useQuery({
    queryKey: [...PROGRAMS_KEY, 'list', params],
    queryFn: () => adminProgramsApi.listPrograms(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProgram(id: number | null) {
  return useQuery({
    queryKey: [...PROGRAMS_KEY, 'detail', id],
    queryFn: () => adminProgramsApi.getProgram(id as number),
    enabled: id !== null,
  });
}

function useInvalidatePrograms() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
}

export function useCreateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (input: ProgramInput) => adminProgramsApi.createProgram(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProgramInput }) =>
      adminProgramsApi.updateProgram(id, input),
    onSuccess: invalidate,
  });
}

export type ProgramStatusAction = 'activate' | 'deactivate' | 'archive';

export function useProgramStatusAction() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number;
      action: ProgramStatusAction;
    }) => {
      if (action === 'activate') return adminProgramsApi.activateProgram(id);
      if (action === 'deactivate')
        return adminProgramsApi.deactivateProgram(id);
      return adminProgramsApi.archiveProgram(id);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (id: number) => adminProgramsApi.deleteProgram(id),
    onSuccess: invalidate,
  });
}

/* ------------------------- Participants ------------------------- */

export function useProgramParticipants(
  programId: number,
  params: ParticipantsListParams,
) {
  return useQuery({
    queryKey: [...PROGRAMS_KEY, 'participants', programId, params],
    queryFn: () =>
      adminProgramParticipantsApi.listParticipants(programId, params),
    placeholderData: keepPreviousData,
  });
}

export type ParticipantAction = 'approve' | 'reject';

export function useParticipantAction() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: ParticipantAction }) =>
      action === 'approve'
        ? adminProgramParticipantsApi.approveParticipant(id)
        : adminProgramParticipantsApi.rejectParticipant(id),
    onSuccess: invalidate,
  });
}
