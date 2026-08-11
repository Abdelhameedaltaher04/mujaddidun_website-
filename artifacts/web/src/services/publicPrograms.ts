/**
 * Public website programs service — Laravel endpoints:
 *   GET  /public/programs                   (active/completed only, paginated)
 *   GET  /public/programs/{id}              (detail; 404 for draft/archived)
 *   POST /public/programs/{id}/participate  (authenticated self-participation)
 *
 * Draft and archived programs are never returned by these endpoints.
 */
import { apiClient, type ApiEnvelope } from './api';

export type PublicProgramStatus = 'active' | 'completed';

export type PublicProgramCategory =
  | 'education'
  | 'health'
  | 'community'
  | 'environment'
  | 'youth'
  | 'relief';

export interface PublicProgramItem {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  category: PublicProgramCategory;
  target_audience_ar: string;
  target_audience_en: string;
  location_ar: string;
  location_en: string;
  start_date: string | null;
  end_date: string | null;
  status: PublicProgramStatus;
  image_url: string | null;
  /** Server-computed advisory flag (server re-validates on participate). */
  participation_open: boolean;
  capacity: number | null;
  participants_count: number;
  available_spots: number | null;
  /** True when the authenticated caller already participates. */
  is_participating: boolean;
}

export interface PublicProgramDetail extends PublicProgramItem {
  description_ar: string;
  description_en: string;
  objectives_ar: string;
  objectives_en: string;
  requirements_ar: string;
  requirements_en: string;
}

export interface PublicProgramsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PublicProgramsPage {
  data: PublicProgramItem[];
  meta: PublicProgramsMeta;
}

export interface PublicProgramsFilters {
  page?: number;
  per_page?: number;
  category?: PublicProgramCategory;
  status?: PublicProgramStatus;
}

type ListEnvelope = ApiEnvelope<PublicProgramItem[]> & { meta: PublicProgramsMeta };

/** Participation business-error codes returned by the backend. */
export type ParticipationErrorCode = 'already_registered' | 'closed' | 'full';

export const publicProgramsApi = {
  /** GET /public/programs */
  async list(filters: PublicProgramsFilters = {}): Promise<PublicProgramsPage> {
    const response = await apiClient.get<ListEnvelope>('/public/programs', {
      params: {
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 9,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
    });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /public/programs/{id} */
  async get(id: string | number): Promise<PublicProgramDetail> {
    const response = await apiClient.get<ApiEnvelope<PublicProgramDetail>>(
      `/public/programs/${id}`,
    );
    return response.data.data;
  },

  /** POST /public/programs/{id}/participate */
  async participate(id: number): Promise<void> {
    await apiClient.post(`/public/programs/${id}/participate`);
  },
};

/** Extract the machine-readable participation error code, if present. */
export function participationErrorCode(error: unknown): ParticipationErrorCode | null {
  const code = (error as { response?: { data?: { errors?: { code?: string } } } })
    ?.response?.data?.errors?.code;
  return code === 'already_registered' || code === 'closed' || code === 'full'
    ? code
    : null;
}
