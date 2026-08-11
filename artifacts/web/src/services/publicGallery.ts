/**
 * Public website gallery service — Laravel endpoints:
 *   GET /public/gallery/albums               (published only, paginated)
 *   GET /public/gallery/albums/{id}          (detail; 404 for draft/archived)
 *   GET /public/gallery/albums/{id}/images   (paginated images of a published album)
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicGalleryAlbum {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  cover_image_url: string | null;
  images_count: number;
  published_at: string | null;
}

export interface PublicGalleryImage {
  id: number;
  url: string;
  title_ar: string;
  title_en: string;
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  width: number | null;
  height: number | null;
}

export interface PublicGalleryMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

type ListEnvelope<T> = ApiEnvelope<T[]> & { meta: PublicGalleryMeta };

export const publicGalleryApi = {
  /** GET /public/gallery/albums */
  async listAlbums(page = 1, perPage = 12): Promise<{ data: PublicGalleryAlbum[]; meta: PublicGalleryMeta }> {
    const response = await apiClient.get<ListEnvelope<PublicGalleryAlbum>>(
      '/public/gallery/albums',
      { params: { page, per_page: perPage } },
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /public/gallery/albums/{id} */
  async getAlbum(id: string | number): Promise<PublicGalleryAlbum> {
    const response = await apiClient.get<ApiEnvelope<PublicGalleryAlbum>>(
      `/public/gallery/albums/${id}`,
    );
    return response.data.data;
  },

  /** GET /public/gallery/albums/{id}/images */
  async listImages(id: string | number, page = 1, perPage = 24): Promise<{ data: PublicGalleryImage[]; meta: PublicGalleryMeta }> {
    const response = await apiClient.get<ListEnvelope<PublicGalleryImage>>(
      `/public/gallery/albums/${id}/images`,
      { params: { page, per_page: perPage } },
    );
    return { data: response.data.data, meta: response.data.meta };
  },
};
