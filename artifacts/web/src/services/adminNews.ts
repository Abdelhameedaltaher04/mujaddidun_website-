/**
 * Admin news management service — connected to the real Laravel API.
 *
 * Laravel endpoints (all under /api/v1, Sanctum bearer auth, NewsPolicy —
 * admins and moderators):
 *   GET    /news              (server-side filters + pagination)
 *   GET    /news/{id}
 *   POST   /news              (multipart when an image is attached)
 *   PUT    /news/{id}         (sent as POST + _method=PUT for multipart)
 *   PATCH  /news/{id}/publish
 *   PATCH  /news/{id}/unpublish
 *   PATCH  /news/{id}/archive
 *   DELETE /news/{id}
 */
import { apiClient, type ApiEnvelope } from './api';

export type NewsStatus = 'draft' | 'published' | 'archived';

export type NewsCategorySlug =
  | 'announcements'
  | 'activities'
  | 'programs'
  | 'press';

export const NEWS_CATEGORIES: NewsCategorySlug[] = [
  'announcements',
  'activities',
  'programs',
  'press',
];

export const NEWS_TITLE_MAX = 150;
export const NEWS_EXCERPT_MAX = 300;
export const NEWS_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const NEWS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface NewsArticle {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  category: NewsCategorySlug;
  author: string;
  status: NewsStatus;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsListParams {
  search?: string;
  category?: NewsCategorySlug;
  status?: NewsStatus;
  published_from?: string;
  published_to?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface NewsInput {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  category: NewsCategorySlug;
  author: string;
  status: NewsStatus;
  published_at: string | null;
  featured_image: File | null;
  remove_featured_image: boolean;
}

type ListEnvelope = ApiEnvelope<NewsArticle[]> & {
  meta: PaginatedResponse<NewsArticle>['meta'];
};

/** Laravel multipart body for create/update. */
function buildFormData(input: NewsInput, method?: 'PUT'): FormData {
  const form = new FormData();
  if (method) form.append('_method', method);
  form.append('title_ar', input.title_ar);
  form.append('title_en', input.title_en);
  form.append('excerpt_ar', input.excerpt_ar);
  form.append('excerpt_en', input.excerpt_en);
  form.append('content_ar', input.content_ar);
  form.append('content_en', input.content_en);
  form.append('category', input.category);
  form.append('author', input.author);
  form.append('status', input.status);
  // Always sent: Laravel converts '' to null, so an explicit empty value
  // clears the date while an omitted field would keep the stored one.
  form.append('published_at', input.published_at ?? '');
  if (input.featured_image) {
    form.append('featured_image', input.featured_image);
  }
  form.append('remove_featured_image', input.remove_featured_image ? '1' : '0');
  return form;
}

export const adminNewsApi = {
  /** GET /news */
  async listNews(
    params: NewsListParams,
  ): Promise<PaginatedResponse<NewsArticle>> {
    const response = await apiClient.get<ListEnvelope>('/news', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /news/{id} */
  async getNews(id: number): Promise<NewsArticle> {
    const response = await apiClient.get<ApiEnvelope<NewsArticle>>(
      `/news/${id}`,
    );
    return response.data.data;
  },

  /** POST /news */
  async createNews(input: NewsInput): Promise<NewsArticle> {
    const response = await apiClient.post<ApiEnvelope<NewsArticle>>(
      '/news',
      buildFormData(input),
    );
    return response.data.data;
  },

  /** PUT /news/{id} — POST + _method=PUT so PHP parses multipart bodies. */
  async updateNews(id: number, input: NewsInput): Promise<NewsArticle> {
    const response = await apiClient.post<ApiEnvelope<NewsArticle>>(
      `/news/${id}`,
      buildFormData(input, 'PUT'),
    );
    return response.data.data;
  },

  /** PATCH /news/{id}/publish | /news/{id}/unpublish */
  async setPublished(id: number, publish: boolean): Promise<NewsArticle> {
    const response = await apiClient.patch<ApiEnvelope<NewsArticle>>(
      `/news/${id}/${publish ? 'publish' : 'unpublish'}`,
    );
    return response.data.data;
  },

  /** PATCH /news/{id}/archive */
  async archiveNews(id: number): Promise<NewsArticle> {
    const response = await apiClient.patch<ApiEnvelope<NewsArticle>>(
      `/news/${id}/archive`,
    );
    return response.data.data;
  },

  /** DELETE /news/{id} */
  async deleteNews(id: number): Promise<void> {
    await apiClient.delete(`/news/${id}`);
  },
};
