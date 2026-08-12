import { apiClient, type ApiEnvelope } from '@/services/api';
import type {
  AboutContent,
  CtaSection,
  FooterContent,
  HeroContent,
  HomepageSection,
  SiteStatistic,
  VisionMissionContent,
} from '@/services/adminContent';

/**
 * Sanitized public website content (GET /public/content, no auth):
 * statistics/ctas contain only active rows in display order;
 * homepage_sections carries visibility + order for every section.
 */
export interface PublicContent {
  sections: {
    hero: HeroContent;
    about: AboutContent;
    vision_mission: VisionMissionContent;
    footer: FooterContent;
  };
  statistics: Array<Pick<SiteStatistic, 'id' | 'number' | 'label_ar' | 'label_en' | 'icon'>>;
  ctas: CtaSection[];
  homepage_sections: HomepageSection[];
}

export async function fetchPublicContent(): Promise<PublicContent> {
  const response = await apiClient.get<ApiEnvelope<PublicContent>>('/public/content');
  return response.data.data;
}
