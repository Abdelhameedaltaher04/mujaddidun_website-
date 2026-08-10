/**
 * Admin programs management service.
 *
 * Mirrors the future Laravel endpoints (noted per function) with the exact
 * payload shapes (paginator envelope, multipart-ready input), so the API
 * swap replaces only the mock calls with `apiClient` requests.
 *
 * Future endpoints:
 *   GET    /programs           (list; server-side filters + pagination)
 *   GET    /programs/{id}
 *   POST   /programs           (multipart when image present)
 *   PUT    /programs/{id}
 *   PATCH  /programs/{id}/activate
 *   PATCH  /programs/{id}/deactivate
 *   PATCH  /programs/{id}/archive
 *   DELETE /programs/{id}
 */
import { mockProgramsDb } from './mocks/adminProgramsMock';

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

export const adminProgramsApi = {
  /** GET /programs */
  async listPrograms(
    params: ProgramsListParams,
  ): Promise<PaginatedResponse<AdminProgram>> {
    return mockProgramsDb.list(params);
  },

  /** GET /programs/{id} */
  async getProgram(id: number): Promise<AdminProgram> {
    return mockProgramsDb.get(id);
  },

  /** POST /programs */
  async createProgram(input: ProgramInput): Promise<AdminProgram> {
    return mockProgramsDb.create(input);
  },

  /** PUT /programs/{id} */
  async updateProgram(id: number, input: ProgramInput): Promise<AdminProgram> {
    return mockProgramsDb.update(id, input);
  },

  /** PATCH /programs/{id}/activate */
  async activateProgram(id: number): Promise<AdminProgram> {
    return mockProgramsDb.setStatus(id, 'active');
  },

  /** PATCH /programs/{id}/deactivate  (back to draft) */
  async deactivateProgram(id: number): Promise<AdminProgram> {
    return mockProgramsDb.setStatus(id, 'draft');
  },

  /** PATCH /programs/{id}/archive */
  async archiveProgram(id: number): Promise<AdminProgram> {
    return mockProgramsDb.setStatus(id, 'archived');
  },

  /** DELETE /programs/{id} */
  async deleteProgram(id: number): Promise<void> {
    return mockProgramsDb.remove(id);
  },
};
