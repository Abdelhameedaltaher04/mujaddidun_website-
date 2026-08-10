import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminNewsApi,
  type NewsInput,
  type NewsListParams,
} from '@/services/adminNews';

const NEWS_KEY = ['admin', 'news'] as const;

export function useAdminNewsList(params: NewsListParams) {
  return useQuery({
    queryKey: [...NEWS_KEY, 'list', params],
    queryFn: () => adminNewsApi.listNews(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminNewsArticle(id: number | null) {
  return useQuery({
    queryKey: [...NEWS_KEY, 'detail', id],
    queryFn: () => adminNewsApi.getNews(id as number),
    enabled: id !== null,
  });
}

function useInvalidateNews() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: NEWS_KEY });
}

export function useCreateNews() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: (input: NewsInput) => adminNewsApi.createNews(input),
    onSuccess: invalidate,
  });
}

export function useUpdateNews() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: NewsInput }) =>
      adminNewsApi.updateNews(id, input),
    onSuccess: invalidate,
  });
}

export function useSetNewsPublished() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      adminNewsApi.setPublished(id, publish),
    onSuccess: invalidate,
  });
}

export function useArchiveNews() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: (id: number) => adminNewsApi.archiveNews(id),
    onSuccess: invalidate,
  });
}

export function useDeleteNews() {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: (id: number) => adminNewsApi.deleteNews(id),
    onSuccess: invalidate,
  });
}
