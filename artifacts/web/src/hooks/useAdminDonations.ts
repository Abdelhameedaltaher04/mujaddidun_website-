import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminDonationsApi,
  type DonationStatus,
  type DonationsListParams,
} from '@/services/adminDonations';

const KEY_PREFIX = ['admin', 'donations'] as const;

export function useAdminDonationsList(params: DonationsListParams) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'list', params],
    queryFn: () => adminDonationsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDonationStatistics() {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'statistics'],
    queryFn: () => adminDonationsApi.statistics(),
  });
}

export function useAdminDonation(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'detail', id],
    queryFn: () => adminDonationsApi.get(id as number),
    enabled: id !== null,
  });
}

function useInvalidateDonations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
}

export function useDonationStatusAction() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: Extract<DonationStatus, 'completed' | 'failed'>;
    }) => adminDonationsApi.setStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useRefundDonation() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: (id: number) => adminDonationsApi.refund(id),
    onSuccess: invalidate,
  });
}

export function useCancelDonation() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: (id: number) => adminDonationsApi.cancel(id),
    onSuccess: invalidate,
  });
}
