/**
 * Public website FAQs service — Laravel endpoint:
 *   GET /public/faqs  (published FAQs only, admin display order)
 */
import { apiClient, type ApiEnvelope } from './api';

export interface PublicFaq {
  id: number;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  category: string | null;
  display_order: number;
}

export const publicFaqsApi = {
  /** GET /public/faqs */
  async list(): Promise<PublicFaq[]> {
    const response = await apiClient.get<ApiEnvelope<PublicFaq[]>>('/public/faqs');
    return response.data.data;
  },
};

export function faqQuestion(faq: PublicFaq, lang: 'ar' | 'en'): string {
  return (lang === 'ar' ? faq.question_ar : faq.question_en) || faq.question_ar || faq.question_en;
}

export function faqAnswer(faq: PublicFaq, lang: 'ar' | 'en'): string {
  return (lang === 'ar' ? faq.answer_ar : faq.answer_en) || faq.answer_ar || faq.answer_en;
}
