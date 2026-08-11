import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  publicProgramsApi,
  type PublicProgramsFilters,
} from '@/services/publicPrograms';

export function usePublicProgramsList(filters: PublicProgramsFilters) {
  return useQuery({
    queryKey: ['public-programs', filters],
    queryFn: () => publicProgramsApi.list(filters),
    retry: 1,
  });
}

export function usePublicProgram(id: string | undefined) {
  return useQuery({
    queryKey: ['public-program', id],
    queryFn: () => publicProgramsApi.get(id as string),
    enabled: !!id && /^\d+$/.test(id),
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useParticipateInProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: number) => publicProgramsApi.participate(programId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['public-programs'] });
      queryClient.invalidateQueries({ queryKey: ['public-program'] });
    },
  });
}
