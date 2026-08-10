/**
 * Admin events management service — connected to the real Laravel API.
 *
 * Endpoints (under /api/v1, Sanctum bearer auth, EventPolicy — admins and
 * moderators):
 *   GET    /events           (server-side filters + pagination)
 *   GET    /events/{id}
 *   POST   /events           (multipart when image present)
 *   PUT    /events/{id}      (sent as POST + _method=PUT for multipart)
 *   PATCH  /events/{id}/publish   { publish: boolean }
 *   PATCH  /events/{id}/cancel
 *   DELETE /events/{id}
 */
import { apiClient, type ApiEnvelope } from './api';

export type EventStatus =
  | 'draft'
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled';
export type RegistrationOpenStatus = 'open' | 'closed';

export const EVENT_STATUSES: EventStatus[] = [
  'draft',
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
];

export const EVENT_TITLE_MAX = 150;
export const EVENT_EXCERPT_MAX = 300;
export const EVENT_LOCATION_MAX = 120;
/** JPG / PNG / WEBP up to 5MB (same policy as news images). */
export { NEWS_IMAGE_TYPES as EVENT_IMAGE_TYPES, NEWS_IMAGE_MAX_BYTES as EVENT_IMAGE_MAX_BYTES } from './adminNews';

export interface AdminEvent {
  id: number;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  /** Sanitized HTML from the rich text editor. */
  description_ar: string;
  description_en: string;
  location_ar: string;
  location_en: string;
  /** ISO date (yyyy-mm-dd). */
  event_date: string;
  /** 24h HH:mm. */
  start_time: string;
  end_time: string;
  max_participants: number;
  registration_start_date: string | null;
  registration_end_date: string | null;
  /** Admin-controlled switch; effective openness also derives from state. */
  registration_status: RegistrationOpenStatus;
  status: EventStatus;
  registrations_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Whether the event can accept NEW registrations right now. Open only for
 * publicly registrable statuses (upcoming/ongoing) with the switch on and
 * seats remaining. The Laravel API will enforce the same rule server-side.
 */
export function isRegistrationEffectivelyOpen(event: AdminEvent): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const windowOpen =
    (!event.registration_start_date ||
      event.registration_start_date <= today) &&
    (!event.registration_end_date || today <= event.registration_end_date);
  return (
    event.registration_status === 'open' &&
    (event.status === 'upcoming' || event.status === 'ongoing') &&
    windowOpen &&
    event.registrations_count < event.max_participants
  );
}

export interface EventsListParams {
  search?: string;
  status?: EventStatus;
  registration_status?: RegistrationOpenStatus;
  date_from?: string;
  date_to?: string;
  location?: string;
  page?: number;
  per_page?: number;
}

export type { PaginatedResponse } from './adminNews';
import type { PaginatedResponse } from './adminNews';

/** Create/update payload; `image` becomes multipart on the Laravel API. */
export interface EventInput {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  description_ar: string;
  description_en: string;
  location_ar: string;
  location_en: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  registration_start_date: string | null;
  registration_end_date: string | null;
  registration_status: RegistrationOpenStatus;
  status: EventStatus;
  image: File | null;
  remove_image: boolean;
}

type ListEnvelope = ApiEnvelope<AdminEvent[]> & {
  meta: PaginatedResponse<AdminEvent>['meta'];
};

/** Laravel multipart body for create/update. */
function buildFormData(input: EventInput, method?: 'PUT'): FormData {
  const form = new FormData();
  if (method) form.append('_method', method);
  form.append('title_ar', input.title_ar);
  form.append('title_en', input.title_en);
  form.append('excerpt_ar', input.excerpt_ar);
  form.append('excerpt_en', input.excerpt_en);
  form.append('description_ar', input.description_ar);
  form.append('description_en', input.description_en);
  form.append('location_ar', input.location_ar);
  form.append('location_en', input.location_en);
  form.append('event_date', input.event_date);
  form.append('start_time', input.start_time);
  form.append('end_time', input.end_time);
  form.append('max_participants', String(input.max_participants));
  // Always sent: Laravel turns '' into null, so an explicit empty value
  // clears the date while an omitted field would keep the stored one.
  form.append('registration_start_date', input.registration_start_date ?? '');
  form.append('registration_end_date', input.registration_end_date ?? '');
  form.append('registration_status', input.registration_status);
  form.append('status', input.status);
  if (input.image) {
    form.append('image', input.image);
  }
  form.append('remove_image', input.remove_image ? '1' : '0');
  return form;
}

export const adminEventsApi = {
  /** GET /events */
  async listEvents(
    params: EventsListParams,
  ): Promise<PaginatedResponse<AdminEvent>> {
    const response = await apiClient.get<ListEnvelope>('/events', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /events/{id} */
  async getEvent(id: number): Promise<AdminEvent> {
    const response = await apiClient.get<ApiEnvelope<AdminEvent>>(
      `/events/${id}`,
    );
    return response.data.data;
  },

  /** POST /events */
  async createEvent(input: EventInput): Promise<AdminEvent> {
    const response = await apiClient.post<ApiEnvelope<AdminEvent>>(
      '/events',
      buildFormData(input),
    );
    return response.data.data;
  },

  /** PUT /events/{id} — POST + _method=PUT so PHP parses multipart bodies. */
  async updateEvent(id: number, input: EventInput): Promise<AdminEvent> {
    const response = await apiClient.post<ApiEnvelope<AdminEvent>>(
      `/events/${id}`,
      buildFormData(input, 'PUT'),
    );
    return response.data.data;
  },

  /** PATCH /events/{id}/publish */
  async setPublished(id: number, publish: boolean): Promise<AdminEvent> {
    const response = await apiClient.patch<ApiEnvelope<AdminEvent>>(
      `/events/${id}/publish`,
      { publish },
    );
    return response.data.data;
  },

  /** PATCH /events/{id}/cancel */
  async cancelEvent(id: number): Promise<AdminEvent> {
    const response = await apiClient.patch<ApiEnvelope<AdminEvent>>(
      `/events/${id}/cancel`,
    );
    return response.data.data;
  },

  /** DELETE /events/{id} */
  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },
};
