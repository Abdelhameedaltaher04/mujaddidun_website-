import { useQuery } from '@tanstack/react-query';
import { publicGalleryApi } from '@/services/publicGallery';

const noRetryOn404 = (failureCount: number, error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 404) return false;
  return failureCount < 1;
};

export function usePublicAlbumsList(page: number) {
  return useQuery({
    queryKey: ['public-gallery-albums', page],
    queryFn: () => publicGalleryApi.listAlbums(page),
    retry: 1,
  });
}

export function usePublicAlbum(id: string | undefined) {
  return useQuery({
    queryKey: ['public-gallery-album', id],
    queryFn: () => publicGalleryApi.getAlbum(id as string),
    enabled: !!id && /^\d+$/.test(id),
    retry: noRetryOn404,
  });
}

export function usePublicAlbumImages(id: string | undefined, page: number, enabled = true) {
  return useQuery({
    queryKey: ['public-gallery-images', id, page],
    queryFn: () => publicGalleryApi.listImages(id as string, page),
    enabled: enabled && !!id && /^\d+$/.test(id),
    retry: noRetryOn404,
  });
}
