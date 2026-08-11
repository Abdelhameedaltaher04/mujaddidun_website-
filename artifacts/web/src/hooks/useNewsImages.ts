import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newsImagesApi } from '@/services/newsImages';
import type { UploadImageItem } from '@/services/adminGallery';

const keyFor = (newsId: number) => ['admin', 'news', newsId, 'images'] as const;

export function useNewsImages(newsId: number | null) {
  return useQuery({
    queryKey: keyFor(newsId ?? 0),
    queryFn: () => newsImagesApi.list(newsId as number),
    enabled: newsId !== null,
  });
}

export function useUploadNewsImages(newsId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      items,
      onProgress,
    }: {
      items: UploadImageItem[];
      onProgress?: (percent: number) => void;
    }) => newsImagesApi.upload(newsId, items, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(newsId) }),
  });
}

export function useReorderNewsImages(newsId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: number[]) => newsImagesApi.reorder(newsId, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(newsId) }),
  });
}

export function useDeleteNewsImage(newsId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: number) => newsImagesApi.remove(imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(newsId) }),
  });
}
