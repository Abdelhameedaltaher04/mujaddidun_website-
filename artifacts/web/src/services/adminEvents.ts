/**
 * Admin events management service.
 *
 * Mirrors the future Laravel endpoints (noted per function) with the exact
 * payload shapes (paginator envelope, multipart-ready input), so the API
 * swap replaces only the mock calls with `apiClient` requests.
 *
 * Future endpoints:
 *   GET    /events           (list; server-side filters + pagination)
 *   GET    /events/{id}
 *   POST   /events           (multipart when image present)
 *   PUT    /events/{id}
 *   PATCH  /events/{id}/publish   { publish: boolean }
 *   PATCH  /events/{id}/cancel
 *   DELETE /events/{id}
 */
import { mockEventsDb } from './mocks/adminEventsMock';

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
  return (
    event.registration_status === 'open' &&
    (event.status === 'upcoming' || event.status === 'ongoing') &&
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

export const adminEventsApi = {
  /** GET /events */
  async listEvents(
    params: EventsListParams,
  ): Promise<PaginatedResponse<AdminEvent>> {
    return mockEventsDb.list(params);
  },

  /** GET /events/{id} */
  async getEvent(id: number): Promise<AdminEvent> {
    return mockEventsDb.get(id);
  },

  /** POST /events */
  async createEvent(input: EventInput): Promise<AdminEvent> {
    return mockEventsDb.create(input);
  },

  /** PUT /events/{id} */
  async updateEvent(id: number, input: EventInput): Promise<AdminEvent> {
    return mockEventsDb.update(id, input);
  },

  /** PATCH /events/{id}/publish */
  async setPublished(id: number, publish: boolean): Promise<AdminEvent> {
    return mockEventsDb.setPublished(id, publish);
  },

  /** PATCH /events/{id}/cancel */
  async cancelEvent(id: number): Promise<AdminEvent> {
    return mockEventsDb.cancel(id);
  },

  /** DELETE /events/{id} */
  async deleteEvent(id: number): Promise<void> {
    return mockEventsDb.remove(id);
  },
};
