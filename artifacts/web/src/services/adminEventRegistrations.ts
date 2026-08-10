/**
 * Admin event registrations service.
 *
 * Future endpoints:
 *   GET   /events/{id}/registrations   (server-side filters + pagination)
 *   PATCH /registrations/{id}/confirm
 *   PATCH /registrations/{id}/cancel
 *   PATCH /registrations/{id}/attended
 */
import { mockEventsDb } from './mocks/adminEventsMock';
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

export const adminEventRegistrationsApi = {
  /** GET /events/{id}/registrations */
  async listRegistrations(
    eventId: number,
    params: RegistrationsListParams,
  ): Promise<PaginatedResponse<EventRegistration>> {
    return mockEventsDb.listRegistrations(eventId, params);
  },

  /** PATCH /registrations/{id}/confirm */
  async confirmRegistration(id: number): Promise<EventRegistration> {
    return mockEventsDb.setRegistrationStatus(id, 'confirmed');
  },

  /** PATCH /registrations/{id}/cancel */
  async cancelRegistration(id: number): Promise<EventRegistration> {
    return mockEventsDb.setRegistrationStatus(id, 'cancelled');
  },

  /** PATCH /registrations/{id}/attended */
  async markAttended(id: number): Promise<EventRegistration> {
    return mockEventsDb.setRegistrationStatus(id, 'attended');
  },
};
