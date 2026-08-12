import { useQuery } from '@tanstack/react-query';
import { publicFaqsApi } from '@/services/publicFaqs';

export function usePublicFaqs() {
  return useQuery({
    queryKey: ['public-faqs'],
    queryFn: () => publicFaqsApi.list(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
