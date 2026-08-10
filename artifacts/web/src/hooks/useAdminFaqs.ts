import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminFaqsApi,
  type FaqInput,
  type FaqStatus,
  type FaqsListParams,
} from '@/services/adminFaqs';

const KEY_PREFIX = ['admin', 'faqs'] as const;

export function useAdminFaqsList(params: FaqsListParams) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'list', params],
    queryFn: () => adminFaqsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminFaq(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'detail', id],
    queryFn: () => adminFaqsApi.get(id as number),
    enabled: id !== null,
  });
}

function useInvalidateFaqs() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
}

export function useCreateFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: (input: FaqInput) => adminFaqsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: FaqInput }) =>
      adminFaqsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useFaqStatusAction() {
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FaqStatus }) =>
      adminFaqsApi.setStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useReorderFaqs() {
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: (ids: number[]) => adminFaqsApi.reorder(ids),
    onSuccess: invalidate,
  });
}

export function useDeleteFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({
    mutationFn: (id: number) => adminFaqsApi.remove(id),
    onSuccess: invalidate,
  });
}
