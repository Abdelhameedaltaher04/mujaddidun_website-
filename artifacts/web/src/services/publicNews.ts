/**
 * Public website news service — read-only, unauthenticated Laravel endpoints:
 *   GET /public/news            (published only, paginated, card fields only)
 *   GET /public/news/{id}       (full content + up to 2 related articles)
 *
 * Drafts and archived articles are never returned by these endpoints.
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicNewsItem {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  category: string | null;
  featured_image_url: string | null;
  published_at: string | null;
}

export interface PublicNewsArticle extends PublicNewsItem {
  content_ar: string;
  content_en: string;
  author: string | null;
  related: PublicNewsItem[];
}

export interface PublicNewsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PublicNewsPage {
  data: PublicNewsItem[];
  meta: PublicNewsMeta;
}

type ListEnvelope = ApiEnvelope<PublicNewsItem[]> & { meta: PublicNewsMeta };

export const publicNewsApi = {
  /** GET /public/news */
  async list(page = 1, perPage = 9): Promise<PublicNewsPage> {
    const response = await apiClient.get<ListEnvelope>('/public/news', {
      params: { page, per_page: perPage },
    });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /public/news/{id} */
  async get(id: string | number): Promise<PublicNewsArticle> {
    const response = await apiClient.get<ApiEnvelope<PublicNewsArticle>>(
      `/public/news/${id}`,
    );
    return response.data.data;
  },
};
