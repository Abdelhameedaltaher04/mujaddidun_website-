/**
 * Admin program participants service.
 *
 * Future endpoints:
 *   GET   /programs/{id}/participants   (server-side filters + pagination)
 *   PATCH /participants/{id}/approve
 *   PATCH /participants/{id}/reject
 */
import { mockProgramsDb } from './mocks/adminProgramsMock';
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

export const adminProgramParticipantsApi = {
  /** GET /programs/{id}/participants */
  async listParticipants(
    programId: number,
    params: ParticipantsListParams,
  ): Promise<PaginatedResponse<ProgramParticipant>> {
    return mockProgramsDb.listParticipants(programId, params);
  },

  /** PATCH /participants/{id}/approve */
  async approveParticipant(id: number): Promise<ProgramParticipant> {
    return mockProgramsDb.setParticipantStatus(id, 'approved');
  },

  /** PATCH /participants/{id}/reject */
  async rejectParticipant(id: number): Promise<ProgramParticipant> {
    return mockProgramsDb.setParticipantStatus(id, 'rejected');
  },
};
