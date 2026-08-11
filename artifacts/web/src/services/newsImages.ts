/**
 * Admin news gallery images service — Laravel endpoints:
 *   GET    /news/{id}/images
 *   POST   /news/{id}/images           (multipart images[] + alt_ar[]/alt_en[])
 *   PATCH  /news/{id}/images/reorder   ({ order: [id, ...] })
 *   DELETE /news/images/{imageId}
 */
import { apiClient, type ApiEnvelope } from './api';
import type { UploadImageItem } from './adminGallery';

export interface NewsGalleryImage {
  id: number;
  /** Public URL served through /api/v1/files. */
  image: string;
  alt_text_ar: string;
  alt_text_en: string;
  display_order: number;
}

export const newsImagesApi = {
  /** GET /news/{id}/images */
  async list(newsId: number): Promise<NewsGalleryImage[]> {
    const response = await apiClient.get<ApiEnvelope<NewsGalleryImage[]>>(
      `/news/${newsId}/images`,
    );
    return response.data.data;
  },

  /** POST /news/{id}/images */
  async upload(
    newsId: number,
    items: UploadImageItem[],
    onProgress?: (percent: number) => void,
  ): Promise<NewsGalleryImage[]> {
    const formData = new FormData();
    items.forEach((item) => {
      formData.append('images[]', item.file);
      formData.append('alt_ar[]', item.alt_ar);
      formData.append('alt_en[]', item.alt_en);
    });
    const response = await apiClient.post<ApiEnvelope<NewsGalleryImage[]>>(
      `/news/${newsId}/images`,
      formData,
      {
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );
    return response.data.data;
  },

  /** PATCH /news/{id}/images/reorder */
  async reorder(newsId: number, order: number[]): Promise<NewsGalleryImage[]> {
    const response = await apiClient.patch<ApiEnvelope<NewsGalleryImage[]>>(
      `/news/${newsId}/images/reorder`,
      { order },
    );
    return response.data.data;
  },

  /** DELETE /news/images/{imageId} */
  async remove(imageId: number): Promise<void> {
    await apiClient.delete(`/news/images/${imageId}`);
  },
};
