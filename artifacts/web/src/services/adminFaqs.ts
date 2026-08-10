import { apiClient, type ApiEnvelope } from '@/services/api';
import type { PaginatedResponse } from '@/services/adminNews';
import { mockFaqsDb } from '@/services/mocks/adminFaqsMock';

/**
 * FAQ Management service.
 *
 * Documented Laravel endpoints (bearer token, admin/moderator policies):
 * - GET    /faqs                 list (search, category, status, page, per_page)
 * - GET    /faqs/{id}            single FAQ
 * - POST   /faqs                 create
 * - PUT    /faqs/{id}            update
 * - PATCH  /faqs/{id}/status     { status }
 * - PATCH  /faqs/reorder         { ids: number[] } — position = index + 1
 * - DELETE /faqs/{id}
 *
 * All responses use the ApiEnvelope + Laravel paginator (`data` + `meta`)
 * shapes. Swap USE_MOCK to false once the Laravel API is connected.
 */
const USE_MOCK = true;

export const FAQ_STATUSES = ['published', 'draft', 'archived'] as const;
export type FaqStatus = (typeof FAQ_STATUSES)[number];

export const FAQ_CATEGORIES = [
  'general',
  'membership',
  'programs',
  'events',
  'donations',
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export const FAQ_QUESTION_MAX = 300;
export const FAQ_ANSWER_MAX = 2000;

export interface Faq {
  id: number;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  /** Optional grouping used by the public FAQ section. */
  category: FaqCategory | null;
  display_order: number;
  status: FaqStatus;
  created_at: string;
  updated_at: string;
}

export interface FaqInput {
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  category: FaqCategory | null;
  display_order: number;
  status: FaqStatus;
}

export interface FaqsListParams {
  search?: string;
  category?: FaqCategory;
  status?: FaqStatus;
  page?: number;
  per_page?: number;
}

export const adminFaqsApi = {
  /** GET /faqs */
  async list(params: FaqsListParams): Promise<PaginatedResponse<Faq>> {
    if (USE_MOCK) return mockFaqsDb.list(params);
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<Faq>>>(
      '/faqs',
      { params },
    );
    return response.data.data;
  },

  /** GET /faqs/{id} */
  async get(id: number): Promise<Faq> {
    if (USE_MOCK) return mockFaqsDb.get(id);
    const response = await apiClient.get<ApiEnvelope<Faq>>(`/faqs/${id}`);
    return response.data.data;
  },

  /** POST /faqs */
  async create(input: FaqInput): Promise<Faq> {
    if (USE_MOCK) return mockFaqsDb.create(input);
    const response = await apiClient.post<ApiEnvelope<Faq>>('/faqs', input);
    return response.data.data;
  },

  /** PUT /faqs/{id} */
  async update(id: number, input: FaqInput): Promise<Faq> {
    if (USE_MOCK) return mockFaqsDb.update(id, input);
    const response = await apiClient.put<ApiEnvelope<Faq>>(
      `/faqs/${id}`,
      input,
    );
    return response.data.data;
  },

  /** PATCH /faqs/{id}/status */
  async setStatus(id: number, status: FaqStatus): Promise<Faq> {
    if (USE_MOCK) return mockFaqsDb.setStatus(id, status);
    const response = await apiClient.patch<ApiEnvelope<Faq>>(
      `/faqs/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /**
   * PATCH /faqs/reorder — `ids` in the desired display order;
   * the server assigns display_order = index + 1.
   */
  async reorder(ids: number[]): Promise<Faq[]> {
    if (USE_MOCK) return mockFaqsDb.reorder(ids);
    const response = await apiClient.patch<ApiEnvelope<Faq[]>>(
      '/faqs/reorder',
      { ids },
    );
    return response.data.data;
  },

  /** DELETE /faqs/{id} */
  async remove(id: number): Promise<void> {
    if (USE_MOCK) return mockFaqsDb.remove(id);
    await apiClient.delete(`/faqs/${id}`);
  },
};
