/**
 * Admin news management service.
 *
 * Functions mirror the future Laravel endpoints noted alongside them and
 * use the exact payload shapes (Laravel paginator envelope, multipart-ready
 * create/update inputs), so the API swap replaces only the mock calls with
 * `apiClient` requests.
 *
 * Future endpoints:
 *   GET    /news            (list; server-side filters + pagination)
 *   GET    /news/{id}
 *   POST   /news            (multipart when featured_image present)
 *   PUT    /news/{id}
 *   PATCH  /news/{id}/publish    { publish: boolean }
 *   PATCH  /news/{id}/archive
 *   DELETE /news/{id}
 */
import { mockNewsDb } from './mocks/adminNewsMock';

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
/** JPG / PNG / WEBP up to 5MB. */
export const NEWS_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const NEWS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface NewsArticle {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  /** Sanitized HTML from the rich text editor. */
  content_ar: string;
  content_en: string;
  category: NewsCategorySlug;
  author: string;
  status: NewsStatus;
  featured_image_url: string | null;
  /** ISO date; set when publishing (scheduled or actual). */
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

/**
 * Create/update payload. `featured_image` becomes a multipart file upload
 * against Laravel; `remove_featured_image` clears an existing image.
 */
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

export const adminNewsApi = {
  /** GET /news */
  async listNews(
    params: NewsListParams,
  ): Promise<PaginatedResponse<NewsArticle>> {
    return mockNewsDb.list(params);
  },

  /** GET /news/{id} */
  async getNews(id: number): Promise<NewsArticle> {
    return mockNewsDb.get(id);
  },

  /** POST /news */
  async createNews(input: NewsInput): Promise<NewsArticle> {
    return mockNewsDb.create(input);
  },

  /** PUT /news/{id} */
  async updateNews(id: number, input: NewsInput): Promise<NewsArticle> {
    return mockNewsDb.update(id, input);
  },

  /** PATCH /news/{id}/publish */
  async setPublished(id: number, publish: boolean): Promise<NewsArticle> {
    return mockNewsDb.setStatus(id, publish ? 'published' : 'draft');
  },

  /** PATCH /news/{id}/archive */
  async archiveNews(id: number): Promise<NewsArticle> {
    return mockNewsDb.setStatus(id, 'archived');
  },

  /** DELETE /news/{id} */
  async deleteNews(id: number): Promise<void> {
    return mockNewsDb.remove(id);
  },
};
