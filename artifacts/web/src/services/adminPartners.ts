import { apiClient, type ApiEnvelope } from '@/services/api';
import type { PaginatedResponse } from '@/services/adminNews';

/**
 * Partners Management service.
 *
 * Documented Laravel endpoints (bearer token, admin/moderator policies):
 * - GET    /partners                 list (search, type, status, page, per_page)
 * - GET    /partners/{id}            single partner
 * - POST   /partners                 create (multipart when logo present)
 * - PUT    /partners/{id}            update (multipart when logo present)
 * - PATCH  /partners/{id}/status     { status }
 * - PATCH  /partners/reorder         { ids: number[] } — position = index + 1
 * - DELETE /partners/{id}
 *
 * All responses use the ApiEnvelope + Laravel paginator (`data` + `meta`)
 * shapes.
 */

export type PartnerStatus = 'active' | 'inactive';

export const PARTNER_TYPES = [
  'strategic',
  'sponsor',
  'media',
  'community',
  'academic',
] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_NAME_MAX = 150;
export const PARTNER_DESCRIPTION_MAX = 300;
export const PARTNER_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];
export const PARTNER_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export interface Partner {
  id: number;
  name_ar: string;
  name_en: string;
  logo_url: string | null;
  type: PartnerType;
  website_url: string | null;
  description_ar: string;
  description_en: string;
  display_order: number;
  status: PartnerStatus;
  created_at: string;
  updated_at: string;
}

export interface PartnerInput {
  name_ar: string;
  name_en: string;
  /** New logo file; required on create, optional on update. */
  logo?: File | null;
  type: PartnerType;
  website_url: string | null;
  description_ar: string;
  description_en: string;
  display_order: number;
  status: PartnerStatus;
}

export interface PartnersListParams {
  search?: string;
  type?: PartnerType;
  status?: PartnerStatus;
  page?: number;
  per_page?: number;
}

export const adminPartnersApi = {
  /** GET /partners */
  async list(params: PartnersListParams): Promise<PaginatedResponse<Partner>> {
    const response = await apiClient.get<
      ApiEnvelope<Partner[]> & { meta: PaginatedResponse<Partner>['meta'] }
    >('/partners', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /partners/{id} */
  async get(id: number): Promise<Partner> {
    const response = await apiClient.get<ApiEnvelope<Partner>>(
      `/partners/${id}`,
    );
    return response.data.data;
  },

  /** POST /partners (multipart with `logo` file) */
  async create(input: PartnerInput): Promise<Partner> {
    const response = await apiClient.post<ApiEnvelope<Partner>>(
      '/partners',
      buildPartnerFormData(input),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  /** PUT /partners/{id} (multipart + `_method=PUT` when logo present) */
  async update(id: number, input: PartnerInput): Promise<Partner> {
    const formData = buildPartnerFormData(input);
    formData.append('_method', 'PUT');
    const response = await apiClient.post<ApiEnvelope<Partner>>(
      `/partners/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  /** PATCH /partners/{id}/status */
  async setStatus(id: number, status: PartnerStatus): Promise<Partner> {
    const response = await apiClient.patch<ApiEnvelope<Partner>>(
      `/partners/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /**
   * PATCH /partners/reorder — `ids` in the desired display order;
   * the server assigns display_order = index + 1.
   */
  async reorder(ids: number[]): Promise<Partner[]> {
    const response = await apiClient.patch<ApiEnvelope<Partner[]>>(
      '/partners/reorder',
      { ids },
    );
    return response.data.data;
  },

  /** DELETE /partners/{id} */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/partners/${id}`);
  },
};

function buildPartnerFormData(input: PartnerInput): FormData {
  const formData = new FormData();
  formData.append('name_ar', input.name_ar);
  formData.append('name_en', input.name_en);
  formData.append('type', input.type);
  formData.append('website_url', input.website_url ?? '');
  formData.append('description_ar', input.description_ar);
  formData.append('description_en', input.description_en);
  formData.append('display_order', String(input.display_order));
  formData.append('status', input.status);
  if (input.logo) formData.append('logo', input.logo);
  return formData;
}
