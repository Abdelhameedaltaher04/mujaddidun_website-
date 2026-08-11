/**
 * Public website partners service — Laravel endpoint:
 *   GET /public/partners  (active partners only, admin display order)
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicPartner {
  id: number;
  name_ar: string;
  name_en: string;
  logo_url: string | null;
  website_url: string | null;
  description_ar: string;
  description_en: string;
}

export const publicPartnersApi = {
  /** GET /public/partners */
  async list(): Promise<PublicPartner[]> {
    const response = await apiClient.get<ApiEnvelope<PublicPartner[]>>('/public/partners');
    return response.data.data;
  },
};

export function partnerName(partner: PublicPartner, lang: 'ar' | 'en'): string {
  return (lang === 'ar' ? partner.name_ar : partner.name_en) || partner.name_ar;
}
