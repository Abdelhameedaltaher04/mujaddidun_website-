import { apiClient, type ApiEnvelope } from '@/services/api';
import type { PaginatedResponse } from '@/services/adminNews';
import { mockDonationsDb } from '@/services/mocks/adminDonationsMock';

/**
 * Donations Management service.
 *
 * Documented Laravel endpoints (bearer token; admin manages, moderator
 * read-only via policies):
 * - GET    /donations                  list (search, status, method,
 *                                      date_from, date_to, page, per_page)
 * - GET    /donations/statistics       aggregate stats for the header cards
 * - GET    /donations/{id}             single donation
 * - PATCH  /donations/{id}/status      { status: 'completed' | 'failed' }
 * - PATCH  /donations/{id}/refund      mark a completed donation refunded
 * - PATCH  /donations/{id}/cancel      cancel a pending donation
 *
 * Receipts: the printable/downloadable receipt is rendered client-side for
 * now; Laravel will later expose GET /donations/{id}/receipt returning a
 * generated PDF. No real payment processing happens here.
 *
 * All responses use the ApiEnvelope + Laravel paginator (`data` + `meta`)
 * shapes. Swap USE_MOCK to false once the Laravel API is connected.
 */
const USE_MOCK = true;

export const DONATION_STATUSES = [
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled',
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_METHODS = [
  'card',
  'bank_transfer',
  'paypal',
  'cash',
] as const;
export type DonationMethod = (typeof DONATION_METHODS)[number];

export interface Donation {
  id: number;
  donor_name: string;
  email: string;
  phone: string | null;
  /** Amount in major currency units. */
  amount: number;
  currency: string;
  method: DonationMethod;
  transaction_id: string;
  status: DonationStatus;
  notes: string | null;
  /** Donation date (ISO). */
  donated_at: string;
  created_at: string;
  updated_at: string;
}

export interface DonationsListParams {
  /** Matches donor name, email, or transaction id. */
  search?: string;
  status?: DonationStatus;
  method?: DonationMethod;
  /** Inclusive ISO date bounds (yyyy-mm-dd). */
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface DonationStatistics {
  /** Sum of all non-failed/cancelled donation amounts. */
  total_amount: number;
  /** Sum of completed donation amounts. */
  completed_amount: number;
  pending_count: number;
  donors_count: number;
  /** Sum of completed donations in the current month. */
  this_month_amount: number;
  /** Currency the aggregate amounts are reported in. */
  currency: string;
}

export const adminDonationsApi = {
  /** GET /donations */
  async list(
    params: DonationsListParams,
  ): Promise<PaginatedResponse<Donation>> {
    if (USE_MOCK) return mockDonationsDb.list(params);
    const response = await apiClient.get<
      ApiEnvelope<PaginatedResponse<Donation>>
    >('/donations', { params });
    return response.data.data;
  },

  /** GET /donations/statistics */
  async statistics(): Promise<DonationStatistics> {
    if (USE_MOCK) return mockDonationsDb.statistics();
    const response =
      await apiClient.get<ApiEnvelope<DonationStatistics>>(
        '/donations/statistics',
      );
    return response.data.data;
  },

  /** GET /donations/{id} */
  async get(id: number): Promise<Donation> {
    if (USE_MOCK) return mockDonationsDb.get(id);
    const response = await apiClient.get<ApiEnvelope<Donation>>(
      `/donations/${id}`,
    );
    return response.data.data;
  },

  /** PATCH /donations/{id}/status — mark completed or failed. */
  async setStatus(
    id: number,
    status: Extract<DonationStatus, 'completed' | 'failed'>,
  ): Promise<Donation> {
    if (USE_MOCK) return mockDonationsDb.setStatus(id, status);
    const response = await apiClient.patch<ApiEnvelope<Donation>>(
      `/donations/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /** PATCH /donations/{id}/refund */
  async refund(id: number): Promise<Donation> {
    if (USE_MOCK) return mockDonationsDb.refund(id);
    const response = await apiClient.patch<ApiEnvelope<Donation>>(
      `/donations/${id}/refund`,
    );
    return response.data.data;
  },

  /** PATCH /donations/{id}/cancel */
  async cancel(id: number): Promise<Donation> {
    if (USE_MOCK) return mockDonationsDb.cancel(id);
    const response = await apiClient.patch<ApiEnvelope<Donation>>(
      `/donations/${id}/cancel`,
    );
    return response.data.data;
  },
};
