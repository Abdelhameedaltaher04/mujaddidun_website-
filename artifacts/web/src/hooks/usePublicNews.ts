import { useQuery } from '@tanstack/react-query';
import { publicNewsApi } from '@/services/publicNews';

export function usePublicNewsList(page: number) {
  return useQuery({
    queryKey: ['public-news', page],
    queryFn: () => publicNewsApi.list(page),
    retry: 1,
  });
}

export function usePublicNewsArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['public-news-article', id],
    queryFn: () => publicNewsApi.get(id as string),
    enabled: !!id && /^\d+$/.test(id),
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
  });
}
