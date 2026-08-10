import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminPartnersApi,
  type PartnerInput,
  type PartnerStatus,
  type PartnersListParams,
} from '@/services/adminPartners';

const KEY_PREFIX = ['admin', 'partners'] as const;

export function useAdminPartnersList(params: PartnersListParams) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'list', params],
    queryFn: () => adminPartnersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminPartner(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'detail', id],
    queryFn: () => adminPartnersApi.get(id as number),
    enabled: id !== null,
  });
}

function useInvalidatePartners() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
}

export function useCreatePartner() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: (input: PartnerInput) => adminPartnersApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePartner() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PartnerInput }) =>
      adminPartnersApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function usePartnerStatusAction() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PartnerStatus }) =>
      adminPartnersApi.setStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useReorderPartners() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: (ids: number[]) => adminPartnersApi.reorder(ids),
    onSuccess: invalidate,
  });
}

export function useDeletePartner() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: (id: number) => adminPartnersApi.remove(id),
    onSuccess: invalidate,
  });
}
