/**
 * Locale-aware presentation helpers for public news content. Keeps the
 * pages free of field-picking logic (one UI, both languages).
 */
import type { PublicNewsItem } from '@/services/publicNews';

export type PublicLocale = 'ar' | 'en';

export function newsTitle(item: PublicNewsItem, locale: PublicLocale): string {
  return locale === 'ar' ? item.title_ar : item.title_en;
}

export function newsExcerpt(item: PublicNewsItem, locale: PublicLocale): string {
  return locale === 'ar' ? item.excerpt_ar : item.excerpt_en;
}

export function newsDate(item: PublicNewsItem, locale: PublicLocale): string {
  if (!item.published_at) return '';
  const date = new Date(item.published_at);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** Category slug -> localized label via the existing i18n dictionary key. */
export function newsCategoryKey(category: string | null): string | null {
  return category ? `news.categories.${category}` : null;
}

/** Split stored plain-text content into paragraphs for the article body. */
export function newsParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}|\r\n{2,}|\n|\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
