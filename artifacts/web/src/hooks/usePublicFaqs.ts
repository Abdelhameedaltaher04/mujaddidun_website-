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

export function usePublicFaq(id: number | string | undefined) {
  return useQuery({
    queryKey: ['public-faqs', String(id)],
    queryFn: () => publicFaqsApi.get(id!),
    enabled: id !== undefined,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
