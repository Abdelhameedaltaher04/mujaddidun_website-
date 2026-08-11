/**
 * Public contact form service — real Laravel endpoint:
 *   POST /public/contact-messages   (no auth, rate limited, honeypot)
 *
 * Validation errors come back as field-level Laravel errors; use
 * getApiError(error).fields to map them onto the form.
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicContactInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot — hidden field humans never fill; bots that do are rejected. */
  website?: string;
}

export const publicContactApi = {
  /** POST /public/contact-messages */
  async send(input: PublicContactInput): Promise<void> {
    await apiClient.post<ApiEnvelope<null>>('/public/contact-messages', {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
      ...(input.website ? { website: input.website } : {}),
    });
  },
};
