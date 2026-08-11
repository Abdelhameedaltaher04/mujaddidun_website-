/**
 * Admin programs management service — connected to the real Laravel API.
 *
 * Endpoints (under /api/v1, Sanctum bearer auth, ProgramPolicy — admins and
 * moderators):
 *   GET    /programs           (server-side filters + pagination)
 *   GET    /programs/{id}
 *   POST   /programs           (multipart when image present)
 *   PUT    /programs/{id}      (sent as POST + _method=PUT for multipart)
 *   PATCH  /programs/{id}/activate
 *   PATCH  /programs/{id}/deactivate   (back to draft)
 *   PATCH  /programs/{id}/archive
 *   DELETE /programs/{id}
 */
import { apiClient, type ApiEnvelope } from './api';

export type ProgramStatus = 'draft' | 'active' | 'completed' | 'archived';

export const PROGRAM_STATUSES: ProgramStatus[] = [
  'draft',
  'active',
  'completed',
  'archived',
];

/** Category keys; labels are translated client-side, values stored as-is. */
export type ProgramCategory =
  | 'education'
  | 'health'
  | 'community'
  | 'environment'
  | 'youth'
  | 'relief';

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  'education',
  'health',
  'community',
  'environment',
  'youth',
  'relief',
];

export const PROGRAM_TITLE_MAX = 150;
export const PROGRAM_EXCERPT_MAX = 300;
export const PROGRAM_LOCATION_MAX = 120;
/** JPG / PNG / WEBP up to 5MB (same policy as news images). */
export { NEWS_IMAGE_TYPES as PROGRAM_IMAGE_TYPES, NEWS_IMAGE_MAX_BYTES as PROGRAM_IMAGE_MAX_BYTES } from './adminNews';

export interface AdminProgram {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  /** Sanitized HTML from the rich text editor. */
  description_ar: string;
  description_en: string;
  category: ProgramCategory;
  target_audience_ar: string;
  target_audience_en: string;
  location_ar: string;
  location_en: string;
  /** ISO dates (yyyy-mm-dd). */
  start_date: string;
  end_date: string;
  max_participants: number;
  /** Plain multi-line text; one objective/requirement per line. */
  objectives_ar: string;
  objectives_en: string;
  requirements_ar: string;
  requirements_en: string;
  status: ProgramStatus;
  participants_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramsListParams {
  search?: string;
  category?: ProgramCategory;
  status?: ProgramStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export type { PaginatedResponse } from './adminNews';
import type { PaginatedResponse } from './adminNews';

/** Create/update payload; `image` becomes multipart on the Laravel API. */
export interface ProgramInput {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  description_ar: string;
  description_en: string;
  category: ProgramCategory;
  target_audience_ar: string;
  target_audience_en: string;
  location_ar: string;
  location_en: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  objectives_ar: string;
  objectives_en: string;
  requirements_ar: string;
  requirements_en: string;
  status: ProgramStatus;
  image: File | null;
  remove_image: boolean;
}

type ListEnvelope = ApiEnvelope<AdminProgram[]> & {
  meta: PaginatedResponse<AdminProgram>['meta'];
};

/** Laravel multipart body for create/update. */
function buildFormData(input: ProgramInput, method?: 'PUT'): FormData {
  const form = new FormData();
  if (method) form.append('_method', method);
  form.append('title_ar', input.title_ar);
  form.append('title_en', input.title_en);
  form.append('excerpt_ar', input.excerpt_ar);
  form.append('excerpt_en', input.excerpt_en);
  form.append('description_ar', input.description_ar);
  form.append('description_en', input.description_en);
  form.append('category', input.category);
  form.append('target_audience_ar', input.target_audience_ar);
  form.append('target_audience_en', input.target_audience_en);
  form.append('location_ar', input.location_ar);
  form.append('location_en', input.location_en);
  form.append('start_date', input.start_date);
  form.append('end_date', input.end_date);
  form.append('max_participants', String(input.max_participants));
  form.append('objectives_ar', input.objectives_ar);
  form.append('objectives_en', input.objectives_en);
  form.append('requirements_ar', input.requirements_ar);
  form.append('requirements_en', input.requirements_en);
  form.append('status', input.status);
  if (input.image) {
    form.append('image', input.image);
  }
  form.append('remove_image', input.remove_image ? '1' : '0');
  return form;
}

export const adminProgramsApi = {
  /** GET /programs */
  async listPrograms(
    params: ProgramsListParams,
  ): Promise<PaginatedResponse<AdminProgram>> {
    const response = await apiClient.get<ListEnvelope>('/programs', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /programs/{id} */
  async getProgram(id: number): Promise<AdminProgram> {
    const response = await apiClient.get<ApiEnvelope<AdminProgram>>(
      `/programs/${id}`,
    );
    return response.data.data;
  },

  /** POST /programs */
  async createProgram(input: ProgramInput): Promise<AdminProgram> {
    const response = await apiClient.post<ApiEnvelope<AdminProgram>>(
      '/programs',
      buildFormData(input),
    );
    return response.data.data;
  },

  /** PUT /programs/{id} — POST + _method=PUT so PHP parses multipart bodies. */
  async updateProgram(id: number, input: ProgramInput): Promise<AdminProgram> {
    const response = await apiClient.post<ApiEnvelope<AdminProgram>>(
      `/programs/${id}`,
      buildFormData(input, 'PUT'),
    );
    return response.data.data;
  },

  /** PATCH /programs/{id}/activate */
  async activateProgram(id: number): Promise<AdminProgram> {
    const response = await apiClient.patch<ApiEnvelope<AdminProgram>>(
      `/programs/${id}/activate`,
    );
    return response.data.data;
  },

  /** PATCH /programs/{id}/deactivate  (back to draft) */
  async deactivateProgram(id: number): Promise<AdminProgram> {
    const response = await apiClient.patch<ApiEnvelope<AdminProgram>>(
      `/programs/${id}/deactivate`,
    );
    return response.data.data;
  },

  /** PATCH /programs/{id}/archive */
  async archiveProgram(id: number): Promise<AdminProgram> {
    const response = await apiClient.patch<ApiEnvelope<AdminProgram>>(
      `/programs/${id}/archive`,
    );
    return response.data.data;
  },

  /** DELETE /programs/{id} */
  async deleteProgram(id: number): Promise<void> {
    await apiClient.delete(`/programs/${id}`);
  },
};
