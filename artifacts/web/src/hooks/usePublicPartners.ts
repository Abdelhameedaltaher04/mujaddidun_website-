import { useQuery } from '@tanstack/react-query';
import { publicPartnersApi } from '@/services/publicPartners';

export function usePublicPartners() {
  return useQuery({
    queryKey: ['public-partners'],
    queryFn: () => publicPartnersApi.list(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
