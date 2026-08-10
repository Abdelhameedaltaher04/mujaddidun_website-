/**
 * Admin event registrations service — connected to the real Laravel API.
 *
 * Endpoints (under /api/v1, Sanctum bearer auth, EventPolicy):
 *   GET   /events/{id}/registrations   (server-side filters + pagination)
 *   PATCH /registrations/{id}/confirm
 *   PATCH /registrations/{id}/cancel
 *   PATCH /registrations/{id}/attended
 */
import { apiClient, type ApiEnvelope } from './api';
import type { PaginatedResponse } from './adminNews';

export type RegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'attended';

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'attended',
];

export interface EventRegistration {
  id: number;
  event_id: number;
  participant_name: string;
  email: string;
  phone: string;
  status: RegistrationStatus;
  registered_at: string;
}

export interface RegistrationsListParams {
  search?: string;
  status?: RegistrationStatus;
  page?: number;
  per_page?: number;
}

type ListEnvelope = ApiEnvelope<EventRegistration[]> & {
  meta: PaginatedResponse<EventRegistration>['meta'];
};

async function setStatus(
  id: number,
  action: 'confirm' | 'cancel' | 'attended',
): Promise<EventRegistration> {
  const response = await apiClient.patch<ApiEnvelope<EventRegistration>>(
    `/registrations/${id}/${action}`,
  );
  return response.data.data;
}

export const adminEventRegistrationsApi = {
  /** GET /events/{id}/registrations */
  async listRegistrations(
    eventId: number,
    params: RegistrationsListParams,
  ): Promise<PaginatedResponse<EventRegistration>> {
    const response = await apiClient.get<ListEnvelope>(
      `/events/${eventId}/registrations`,
      { params },
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  /** PATCH /registrations/{id}/confirm */
  async confirmRegistration(id: number): Promise<EventRegistration> {
    return setStatus(id, 'confirm');
  },

  /** PATCH /registrations/{id}/cancel */
  async cancelRegistration(id: number): Promise<EventRegistration> {
    return setStatus(id, 'cancel');
  },

  /** PATCH /registrations/{id}/attended */
  async markAttended(id: number): Promise<EventRegistration> {
    return setStatus(id, 'attended');
  },
};
