/**
 * Public donation service — real Laravel endpoint:
 *   POST /public/donations   (no auth, rate limited, honeypot)
 *
 * The donation is recorded as `pending` — there is no online payment gateway
 * yet; admins confirm payments (e.g. bank transfers) from the admin panel.
 * Validation errors come back as field-level Laravel errors; use
 * getApiError(error).fields to map them onto the form.
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicDonationInput {
  donor_name: string;
  donor_email: string;
  donor_phone: string;
  amount: number;
  donation_type: string;
  frequency: string;
  /** Honeypot — hidden field humans never fill; bots that do are rejected. */
  website?: string;
}

export interface PublicDonationReceipt {
  id: number;
  amount: number;
  currency: string;
  donation_type: string;
  frequency: string;
  status: string;
}

export const publicDonationsApi = {
  /** POST /public/donations */
  async create(input: PublicDonationInput): Promise<PublicDonationReceipt> {
    const { data } = await apiClient.post<ApiEnvelope<PublicDonationReceipt>>('/public/donations', {
      donor_name: input.donor_name || null,
      donor_email: input.donor_email || null,
      donor_phone: input.donor_phone,
      amount: input.amount,
      donation_type: input.donation_type,
      frequency: input.frequency,
      ...(input.website ? { website: input.website } : {}),
    });
    return data.data;
  },
};
