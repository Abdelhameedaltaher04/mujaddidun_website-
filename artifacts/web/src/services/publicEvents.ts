/**
 * Public website events service — Laravel endpoints:
 *   GET  /public/events                (public statuses only, paginated)
 *   GET  /public/events/{id}           (detail; 404 for draft/cancelled)
 *   POST /public/events/{id}/register  (authenticated self-registration)
 *
 * Draft and cancelled events are never returned by these endpoints.
 */
import { apiClient, type ApiEnvelope } from './api';

export type PublicEventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface PublicEventItem {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  location_ar: string;
  location_en: string;
  starts_at: string | null;
  ends_at: string | null;
  status: PublicEventStatus;
  image_url: string | null;
  registration_required: boolean;
  /** Server-computed advisory flag (server re-validates on register). */
  registration_open: boolean;
  capacity: number | null;
  registered_count: number;
  available_spots: number | null;
  /** True when the authenticated caller already has an active registration. */
  is_registered: boolean;
}

export interface PublicEventDetail extends PublicEventItem {
  description_ar: string;
  description_en: string;
}

export interface PublicEventsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PublicEventsPage {
  data: PublicEventItem[];
  meta: PublicEventsMeta;
}

type ListEnvelope = ApiEnvelope<PublicEventItem[]> & { meta: PublicEventsMeta };

/** Registration business-error codes returned by the backend. */
export type RegistrationErrorCode = 'already_registered' | 'closed' | 'full';

export const publicEventsApi = {
  /** GET /public/events — statuses is a comma-joined lifecycle filter. */
  async list(
    page = 1,
    statuses?: PublicEventStatus[],
    perPage = 8,
  ): Promise<PublicEventsPage> {
    const response = await apiClient.get<ListEnvelope>('/public/events', {
      params: {
        page,
        per_page: perPage,
        ...(statuses && statuses.length ? { status: statuses.join(',') } : {}),
      },
    });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /public/events/{id} */
  async get(id: string | number): Promise<PublicEventDetail> {
    const response = await apiClient.get<ApiEnvelope<PublicEventDetail>>(
      `/public/events/${id}`,
    );
    return response.data.data;
  },

  /** POST /public/events/{id}/register */
  async register(id: number): Promise<void> {
    await apiClient.post(`/public/events/${id}/register`);
  },
};

/** Extract the machine-readable registration error code, if present. */
export function registrationErrorCode(error: unknown): RegistrationErrorCode | null {
  const code = (error as { response?: { data?: { errors?: { code?: string } } } })
    ?.response?.data?.errors?.code;
  return code === 'already_registered' || code === 'closed' || code === 'full'
    ? code
    : null;
}
