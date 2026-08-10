import { apiClient, type ApiEnvelope } from '@/services/api';
import type { PaginatedResponse } from '@/services/adminNews';
import { mockVolunteersDb } from '@/services/mocks/adminVolunteersMock';

/**
 * Volunteer Applications Management service.
 *
 * Documented Laravel endpoints (bearer token, admin/moderator policies —
 * internal notes and documents are never exposed publicly):
 * - GET    /volunteer-applications                list (search, status,
 *          program_id, date_from, date_to, page, per_page)
 * - GET    /volunteer-applications/statistics     summary cards
 * - GET    /volunteer-applications/{id}           full application
 * - PATCH  /volunteer-applications/{id}/status    { status,
 *          rejection_reason? } — reason required when status = rejected
 * - GET    /volunteer-applications/{id}/notes     internal notes
 * - POST   /volunteer-applications/{id}/notes     { body }
 * - GET    /volunteer-applications/{id}/documents private uploads
 *
 * All responses use the ApiEnvelope + Laravel paginator (`data` + `meta`)
 * shapes. Swap USE_MOCK to false once the Laravel API is connected.
 */
const USE_MOCK = true;

export const APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'approved',
  'rejected',
  'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Allowed review transitions (Laravel policy must mirror this matrix):
 * - pending      → under_review / approved / rejected / withdrawn
 * - under_review → approved / rejected / withdrawn
 * - approved / rejected / withdrawn are final.
 */
export const ALLOWED_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  pending: ['under_review', 'approved', 'rejected', 'withdrawn'],
  under_review: ['approved', 'rejected', 'withdrawn'],
  approved: [],
  rejected: [],
  withdrawn: [],
};

export const canTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean => ALLOWED_TRANSITIONS[from].includes(to);

export const NOTE_MAX = 1000;
export const REJECTION_REASON_MAX = 500;

/** Program option used in the filter and application details. */
export interface VolunteerProgram {
  id: number;
  title_ar: string;
  title_en: string;
}

/** List-row shape; the details view adds the profile fields. */
export interface VolunteerApplication {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  country: string | null;
  /** ISO date or null when not provided. */
  date_of_birth: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  preferred_area: string | null;
  program: VolunteerProgram | null;
  availability: string | null;
  motivation: string | null;
  status: ApplicationStatus;
  /** Reason recorded when the application was rejected. */
  rejection_reason: string | null;
  /** Application submission date (ISO). */
  applied_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: number;
  body: string;
  /** Admin/moderator who wrote the note. */
  author_name: string;
  created_at: string;
}

export interface ApplicationDocument {
  id: number;
  name: string;
  /** Mime type, e.g. application/pdf or image/jpeg. */
  file_type: string;
  /** Signed/authorized URL; Laravel must keep these private. */
  url: string;
  uploaded_at: string;
}

export interface ApplicationsListParams {
  /** Matches applicant name, email, or phone. */
  search?: string;
  status?: ApplicationStatus;
  program_id?: number;
  /** Inclusive ISO date bounds (yyyy-mm-dd) on the application date. */
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface ApplicationStatistics {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export interface StatusChangeInput {
  status: ApplicationStatus;
  /** Required when status is `rejected`. */
  rejection_reason?: string;
}

export const adminVolunteersApi = {
  /** GET /volunteer-applications */
  async list(
    params: ApplicationsListParams,
  ): Promise<PaginatedResponse<VolunteerApplication>> {
    if (USE_MOCK) return mockVolunteersDb.list(params);
    const response = await apiClient.get<
      ApiEnvelope<PaginatedResponse<VolunteerApplication>>
    >('/volunteer-applications', { params });
    return response.data.data;
  },

  /** GET /volunteer-applications/statistics */
  async statistics(): Promise<ApplicationStatistics> {
    if (USE_MOCK) return mockVolunteersDb.statistics();
    const response = await apiClient.get<ApiEnvelope<ApplicationStatistics>>(
      '/volunteer-applications/statistics',
    );
    return response.data.data;
  },

  /** Program options for the filter (backed by GET /programs). */
  async programs(): Promise<VolunteerProgram[]> {
    if (USE_MOCK) return mockVolunteersDb.programs();
    const response = await apiClient.get<ApiEnvelope<VolunteerProgram[]>>(
      '/programs',
      { params: { per_page: 100 } },
    );
    return response.data.data;
  },

  /** GET /volunteer-applications/{id} */
  async get(id: number): Promise<VolunteerApplication> {
    if (USE_MOCK) return mockVolunteersDb.get(id);
    const response = await apiClient.get<ApiEnvelope<VolunteerApplication>>(
      `/volunteer-applications/${id}`,
    );
    return response.data.data;
  },

  /** PATCH /volunteer-applications/{id}/status */
  async setStatus(
    id: number,
    input: StatusChangeInput,
  ): Promise<VolunteerApplication> {
    if (USE_MOCK) return mockVolunteersDb.setStatus(id, input);
    const response = await apiClient.patch<ApiEnvelope<VolunteerApplication>>(
      `/volunteer-applications/${id}/status`,
      input,
    );
    return response.data.data;
  },

  /** GET /volunteer-applications/{id}/notes */
  async notes(id: number): Promise<ApplicationNote[]> {
    if (USE_MOCK) return mockVolunteersDb.notes(id);
    const response = await apiClient.get<ApiEnvelope<ApplicationNote[]>>(
      `/volunteer-applications/${id}/notes`,
    );
    return response.data.data;
  },

  /** POST /volunteer-applications/{id}/notes */
  async addNote(id: number, body: string): Promise<ApplicationNote> {
    if (USE_MOCK) return mockVolunteersDb.addNote(id, body);
    const response = await apiClient.post<ApiEnvelope<ApplicationNote>>(
      `/volunteer-applications/${id}/notes`,
      { body },
    );
    return response.data.data;
  },

  /** GET /volunteer-applications/{id}/documents */
  async documents(id: number): Promise<ApplicationDocument[]> {
    if (USE_MOCK) return mockVolunteersDb.documents(id);
    const response = await apiClient.get<ApiEnvelope<ApplicationDocument[]>>(
      `/volunteer-applications/${id}/documents`,
    );
    return response.data.data;
  },
};
