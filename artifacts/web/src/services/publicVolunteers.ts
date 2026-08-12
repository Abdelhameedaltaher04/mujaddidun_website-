/**
 * Public volunteer application service — real Laravel endpoint:
 *   POST /public/volunteer-applications   (no auth, rate limited, honeypot)
 *
 * Creates (or reuses by email) a volunteer profile and files a `pending`
 * application reviewed in the admin panel. Validation errors come back as
 * field-level Laravel errors; use getApiError(error).fields to map them.
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicVolunteerApplicationInput {
  full_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  interests: string[];
  availability: string[];
  experience: string;
  /** Honeypot — hidden field humans never fill; bots that do are rejected. */
  website?: string;
}

export interface PublicVolunteerApplicationReceipt {
  id: number;
  status: string;
}

export const publicVolunteersApi = {
  /** POST /public/volunteer-applications */
  async apply(input: PublicVolunteerApplicationInput): Promise<PublicVolunteerApplicationReceipt> {
    const { data } = await apiClient.post<ApiEnvelope<PublicVolunteerApplicationReceipt>>(
      '/public/volunteer-applications',
      {
        full_name: input.full_name,
        date_of_birth: input.date_of_birth,
        email: input.email,
        phone: input.phone,
        interests: input.interests,
        availability: input.availability,
        experience: input.experience || null,
        ...(input.website ? { website: input.website } : {}),
      },
    );
    return data.data;
  },
};
