import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminGalleryAlbumsApi,
  adminGalleryImagesApi,
  type AlbumInput,
  type AlbumStatus,
  type AlbumsListParams,
  type ImageMetadataInput,
  type UploadImageItem,
} from '@/services/adminGallery';

const GALLERY_KEY = ['admin', 'gallery'] as const;

export function useAdminAlbumsList(params: AlbumsListParams) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'albums', params],
    queryFn: () => adminGalleryAlbumsApi.listAlbums(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminAlbum(id: number | null) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'album', id],
    queryFn: () => adminGalleryAlbumsApi.getAlbum(id as number),
    enabled: id !== null,
  });
}

function useInvalidateGallery() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
}

export function useCreateAlbum() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: (input: AlbumInput) =>
      adminGalleryAlbumsApi.createAlbum(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAlbum() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AlbumInput }) =>
      adminGalleryAlbumsApi.updateAlbum(id, input),
    onSuccess: invalidate,
  });
}

export function useAlbumStatusAction() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AlbumStatus }) =>
      adminGalleryAlbumsApi.setAlbumStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteAlbum() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: (id: number) => adminGalleryAlbumsApi.deleteAlbum(id),
    onSuccess: invalidate,
  });
}

export function useAlbumImages(albumId: number | null) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'images', albumId],
    queryFn: () => adminGalleryImagesApi.listImages(albumId as number),
    enabled: albumId !== null,
  });
}

export function useUploadImages() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: ({
      albumId,
      items,
      onProgress,
    }: {
      albumId: number;
      items: UploadImageItem[];
      onProgress?: (percent: number) => void;
    }) => adminGalleryImagesApi.uploadImages(albumId, items, onProgress),
    onSuccess: invalidate,
  });
}

export function useUpdateImage() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ImageMetadataInput }) =>
      adminGalleryImagesApi.updateImage(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteImage() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: (id: number) => adminGalleryImagesApi.deleteImage(id),
    onSuccess: invalidate,
  });
}

export function useSetImageAsCover() {
  const invalidate = useInvalidateGallery();
  return useMutation({
    mutationFn: (id: number) => adminGalleryImagesApi.setAsCover(id),
    onSuccess: invalidate,
  });
}
