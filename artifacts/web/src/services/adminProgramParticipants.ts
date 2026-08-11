/**
 * Admin program participants service — connected to the real Laravel API.
 *
 * Endpoints (under /api/v1, Sanctum bearer auth, ProgramPolicy):
 *   GET   /programs/{id}/participants   (server-side filters + pagination)
 *   PATCH /participants/{id}/approve
 *   PATCH /participants/{id}/reject
 */
import { apiClient, type ApiEnvelope } from './api';
import type { PaginatedResponse } from './adminNews';

export type ParticipantStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed';

export const PARTICIPANT_STATUSES: ParticipantStatus[] = [
  'pending',
  'approved',
  'rejected',
  'completed',
];

export interface ProgramParticipant {
  id: number;
  program_id: number;
  participant_name: string;
  email: string;
  phone: string;
  status: ParticipantStatus;
  registered_at: string;
}

export interface ParticipantsListParams {
  search?: string;
  status?: ParticipantStatus;
  page?: number;
  per_page?: number;
}

type ListEnvelope = ApiEnvelope<ProgramParticipant[]> & {
  meta: PaginatedResponse<ProgramParticipant>['meta'];
};

export const adminProgramParticipantsApi = {
  /** GET /programs/{id}/participants */
  async listParticipants(
    programId: number,
    params: ParticipantsListParams,
  ): Promise<PaginatedResponse<ProgramParticipant>> {
    const response = await apiClient.get<ListEnvelope>(
      `/programs/${programId}/participants`,
      { params },
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  /** PATCH /participants/{id}/approve */
  async approveParticipant(id: number): Promise<ProgramParticipant> {
    const response = await apiClient.patch<ApiEnvelope<ProgramParticipant>>(
      `/participants/${id}/approve`,
    );
    return response.data.data;
  },

  /** PATCH /participants/{id}/reject */
  async rejectParticipant(id: number): Promise<ProgramParticipant> {
    const response = await apiClient.patch<ApiEnvelope<ProgramParticipant>>(
      `/participants/${id}/reject`,
    );
    return response.data.data;
  },
};
