/** Locale-aware presentation helpers for public programs (mirrors news/events helpers). */
import type { PublicProgramItem } from '@/services/publicPrograms';

type Lang = 'ar' | 'en';

export function programTitle(program: PublicProgramItem, lang: Lang): string {
  return (lang === 'ar' ? program.title_ar : program.title_en) || program.title_ar;
}

export function programExcerpt(program: PublicProgramItem, lang: Lang): string {
  return (lang === 'ar' ? program.excerpt_ar : program.excerpt_en) || '';
}

export function programLocation(program: PublicProgramItem, lang: Lang): string {
  return (lang === 'ar' ? program.location_ar : program.location_en) || '';
}

export function programAudience(program: PublicProgramItem, lang: Lang): string {
  return (lang === 'ar' ? program.target_audience_ar : program.target_audience_en) || '';
}

const LOCALE: Record<Lang, string> = { ar: 'ar-JO', en: 'en-US' };

export function programDate(iso: string | null, lang: Lang): string {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function programDateRange(program: PublicProgramItem, lang: Lang): string {
  const start = programDate(program.start_date, lang);
  const end = programDate(program.end_date, lang);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

/** Split a plain-text field into paragraphs/lines. */
export function programParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
