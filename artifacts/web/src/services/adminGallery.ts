/**
 * Admin gallery management services (albums + images) backed by the real
 * Laravel API. Laravel Policies enforce admin/moderator access on every
 * endpoint; validation errors surface through the shared apiClient handling.
 *
 * Album endpoints:
 *   GET    /gallery/albums          (list; server-side filters + pagination)
 *   GET    /gallery/albums/{id}
 *   POST   /gallery/albums          (multipart when cover_image present)
 *   PUT    /gallery/albums/{id}     (multipart via _method=PUT)
 *   PATCH  /gallery/albums/{id}/status
 *   DELETE /gallery/albums/{id}
 *
 * Image endpoints:
 *   GET    /gallery/albums/{id}/images
 *   POST   /gallery/albums/{id}/images   (multipart, multiple files)
 *   PUT    /gallery/images/{id}          (metadata; multipart when replacing file)
 *   DELETE /gallery/images/{id}
 *   PATCH  /gallery/images/{id}/cover    (set as album cover)
 */
import type { PaginatedResponse } from './adminNews';
import { apiClient } from './api';

export type AlbumStatus = 'draft' | 'published' | 'archived';

export const ALBUM_STATUSES: AlbumStatus[] = [
  'draft',
  'published',
  'archived',
];

export const ALBUM_TITLE_MAX = 150;
export const ALBUM_DESCRIPTION_MAX = 500;
/** JPG / PNG / WEBP up to 5MB — applies to covers and gallery images. */
export const GALLERY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const GALLERY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface GalleryAlbum {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  status: AlbumStatus;
  cover_image_url: string | null;
  images_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumInput {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  status: AlbumStatus;
  /** New cover file; sent as multipart `cover_image` when present. */
  cover_image: File | null;
  remove_cover: boolean;
}

export interface AlbumsListParams {
  search?: string;
  status?: AlbumStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface GalleryImage {
  id: number;
  album_id: number;
  url: string;
  title_ar: string;
  title_en: string;
  /** Required for accessibility. */
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImageMetadataInput {
  title_ar: string;
  title_en: string;
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  /** Replacement file; sent as multipart `image` when present. */
  image?: File | null;
}

/** One item of a multi-file upload: the file plus its required alt text. */
export interface UploadImageItem {
  file: File;
  alt_ar: string;
  alt_en: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginatedResponse<never>['meta'];
}

function albumFormData(input: AlbumInput): FormData {
  const form = new FormData();
  form.append('title_ar', input.title_ar);
  form.append('title_en', input.title_en);
  form.append('description_ar', input.description_ar);
  form.append('description_en', input.description_en);
  form.append('status', input.status);
  form.append('remove_cover', input.remove_cover ? '1' : '0');
  if (input.cover_image) {
    form.append('cover_image', input.cover_image);
  }
  return form;
}

export const adminGalleryAlbumsApi = {
  /** GET /gallery/albums */
  async listAlbums(
    params: AlbumsListParams,
  ): Promise<PaginatedResponse<GalleryAlbum>> {
    const { data } = await apiClient.get<Envelope<GalleryAlbum[]>>(
      '/gallery/albums',
      { params },
    );
    return {
      data: data.data,
      meta: data.meta as PaginatedResponse<GalleryAlbum>['meta'],
    };
  },

  /** GET /gallery/albums/{id} */
  async getAlbum(id: number): Promise<GalleryAlbum> {
    const { data } = await apiClient.get<Envelope<GalleryAlbum>>(
      `/gallery/albums/${id}`,
    );
    return data.data;
  },

  /** POST /gallery/albums */
  async createAlbum(input: AlbumInput): Promise<GalleryAlbum> {
    const { data } = await apiClient.post<Envelope<GalleryAlbum>>(
      '/gallery/albums',
      albumFormData(input),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /** PUT /gallery/albums/{id} (multipart via _method=PUT) */
  async updateAlbum(id: number, input: AlbumInput): Promise<GalleryAlbum> {
    const form = albumFormData(input);
    form.append('_method', 'PUT');
    const { data } = await apiClient.post<Envelope<GalleryAlbum>>(
      `/gallery/albums/${id}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /** PATCH /gallery/albums/{id}/status */
  async setAlbumStatus(id: number, status: AlbumStatus): Promise<GalleryAlbum> {
    const { data } = await apiClient.patch<Envelope<GalleryAlbum>>(
      `/gallery/albums/${id}/status`,
      { status },
    );
    return data.data;
  },

  /** DELETE /gallery/albums/{id} */
  async deleteAlbum(id: number): Promise<void> {
    await apiClient.delete(`/gallery/albums/${id}`);
  },
};

export const adminGalleryImagesApi = {
  /** GET /gallery/albums/{id}/images */
  async listImages(albumId: number): Promise<GalleryImage[]> {
    const { data } = await apiClient.get<Envelope<GalleryImage[]>>(
      `/gallery/albums/${albumId}/images`,
    );
    return data.data;
  },

  /** POST /gallery/albums/{id}/images — multipart multi-file upload. */
  async uploadImages(
    albumId: number,
    items: UploadImageItem[],
    onProgress?: (percent: number) => void,
  ): Promise<GalleryImage[]> {
    const form = new FormData();
    items.forEach((item) => {
      form.append('images[]', item.file);
      form.append('alt_ar[]', item.alt_ar);
      form.append('alt_en[]', item.alt_en);
    });

    const { data } = await apiClient.post<Envelope<GalleryImage[]>>(
      `/gallery/albums/${albumId}/images`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );
    return data.data;
  },

  /** PUT /gallery/images/{id} (multipart via _method=PUT) */
  async updateImage(
    id: number,
    input: ImageMetadataInput,
  ): Promise<GalleryImage> {
    const form = new FormData();
    form.append('_method', 'PUT');
    form.append('title_ar', input.title_ar);
    form.append('title_en', input.title_en);
    form.append('alt_ar', input.alt_ar);
    form.append('alt_en', input.alt_en);
    form.append('caption_ar', input.caption_ar);
    form.append('caption_en', input.caption_en);
    if (input.image) {
      form.append('image', input.image);
    }
    const { data } = await apiClient.post<Envelope<GalleryImage>>(
      `/gallery/images/${id}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /** DELETE /gallery/images/{id} */
  async deleteImage(id: number): Promise<void> {
    await apiClient.delete(`/gallery/images/${id}`);
  },

  /** PATCH /gallery/images/{id}/cover */
  async setAsCover(id: number): Promise<GalleryImage> {
    const { data } = await apiClient.patch<Envelope<GalleryImage>>(
      `/gallery/images/${id}/cover`,
    );
    return data.data;
  },
};
