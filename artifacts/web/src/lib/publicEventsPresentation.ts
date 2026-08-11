/** Locale-aware presentation helpers for public events (mirrors news helpers). */
import type { PublicEventItem } from '@/services/publicEvents';

type Lang = 'ar' | 'en';

export function eventTitle(event: PublicEventItem, lang: Lang): string {
  return (lang === 'ar' ? event.title_ar : event.title_en) || event.title_ar;
}

export function eventExcerpt(event: PublicEventItem, lang: Lang): string {
  return (lang === 'ar' ? event.excerpt_ar : event.excerpt_en) || '';
}

export function eventLocation(event: PublicEventItem, lang: Lang): string {
  return (lang === 'ar' ? event.location_ar : event.location_en) || '';
}

const LOCALE: Record<Lang, string> = { ar: 'ar-JO', en: 'en-US' };

export function eventDate(event: PublicEventItem, lang: Lang): string {
  if (!event.starts_at) return '';
  return new Date(event.starts_at).toLocaleDateString(LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Day-of-month + short month for the card date badge. */
export function eventDayMonth(event: PublicEventItem, lang: Lang): { day: string; month: string } {
  if (!event.starts_at) return { day: '', month: '' };
  const date = new Date(event.starts_at);
  return {
    day: date.toLocaleDateString(LOCALE[lang], { day: 'numeric' }),
    month: date.toLocaleDateString(LOCALE[lang], { month: 'short' }),
  };
}

export function eventTime(iso: string | null, lang: Lang): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(LOCALE[lang], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function eventTimeRange(event: PublicEventItem, lang: Lang): string {
  const start = eventTime(event.starts_at, lang);
  const end = eventTime(event.ends_at, lang);
  if (start && end) return `${start} - ${end}`;
  return start || '';
}

/** Split a plain-text description into paragraphs. */
export function eventParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
