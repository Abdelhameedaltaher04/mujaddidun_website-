import { apiClient, type ApiEnvelope } from '@/services/api';
import type { PaginatedResponse } from '@/services/adminNews';

/**
 * Contact Messages Management service (admin inbox).
 *
 * Documented Laravel endpoints (bearer token; admin/moderator policies —
 * contact messages are never exposed publicly):
 * - GET    /contact-messages                 list (search, read, status,
 *          date_from, date_to, page, per_page)
 * - GET    /contact-messages/statistics      summary cards
 * - GET    /contact-messages/{id}            full message
 * - PATCH  /contact-messages/{id}/read       { is_read } toggle
 * - PATCH  /contact-messages/{id}/status     { status } (new/in_progress/
 *          resolved)
 * - PATCH  /contact-messages/{id}/archive    archive the message
 * - DELETE /contact-messages/{id}            permanent delete
 * - POST   /contact-messages/{id}/reply      { subject, body_html } — Laravel
 *          will send the actual email; the UI only prepares the payload.
 *
 * All responses use the ApiEnvelope + Laravel paginator (`data` + `meta`)
 * shapes.
 */

export const MESSAGE_STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'archived',
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const REPLY_SUBJECT_MAX = 200;

export interface ContactMessage {
  id: number;
  sender_name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  is_read: boolean;
  /** When the message was first read; null while unread. */
  read_at: string | null;
  status: MessageStatus;
  /** When the message was received (ISO). */
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface MessagesListParams {
  /** Matches sender name, email, or subject. */
  search?: string;
  /** Filter by read state. */
  read?: boolean;
  status?: MessageStatus;
  /** Inclusive ISO date bounds (yyyy-mm-dd) on the received date. */
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface MessageStatistics {
  total: number;
  unread: number;
  in_progress: number;
  resolved: number;
}

export interface ReplyInput {
  subject: string;
  /** Rich-text HTML body produced by the editor. */
  body_html: string;
}

export const adminMessagesApi = {
  /** GET /contact-messages */
  async list(
    params: MessagesListParams,
  ): Promise<PaginatedResponse<ContactMessage>> {
    const response = await apiClient.get<
      ApiEnvelope<ContactMessage[]> & {
        meta: PaginatedResponse<ContactMessage>['meta'];
      }
    >('/contact-messages', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /contact-messages/statistics */
  async statistics(): Promise<MessageStatistics> {
    const response = await apiClient.get<ApiEnvelope<MessageStatistics>>(
      '/contact-messages/statistics',
    );
    return response.data.data;
  },

  /** GET /contact-messages/{id} */
  async get(id: number): Promise<ContactMessage> {
    const response = await apiClient.get<ApiEnvelope<ContactMessage>>(
      `/contact-messages/${id}`,
    );
    return response.data.data;
  },

  /** PATCH /contact-messages/{id}/read */
  async setRead(id: number, isRead: boolean): Promise<ContactMessage> {
    const response = await apiClient.patch<ApiEnvelope<ContactMessage>>(
      `/contact-messages/${id}/read`,
      { is_read: isRead },
    );
    return response.data.data;
  },

  /** PATCH /contact-messages/{id}/status */
  async setStatus(id: number, status: MessageStatus): Promise<ContactMessage> {
    const response = await apiClient.patch<ApiEnvelope<ContactMessage>>(
      `/contact-messages/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /** PATCH /contact-messages/{id}/archive */
  async archive(id: number): Promise<ContactMessage> {
    const response = await apiClient.patch<ApiEnvelope<ContactMessage>>(
      `/contact-messages/${id}/archive`,
    );
    return response.data.data;
  },

  /** DELETE /contact-messages/{id} */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/contact-messages/${id}`);
  },

  /**
   * POST /contact-messages/{id}/reply — Laravel will send the email;
   * the mock only validates and records the payload.
   */
  async reply(id: number, input: ReplyInput): Promise<void> {
    await apiClient.post(`/contact-messages/${id}/reply`, input);
  },
};
