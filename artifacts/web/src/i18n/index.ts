import ar from './locales/ar.json';
import en from './locales/en.json';

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ar';

export type Direction = 'rtl' | 'ltr';

export const DIRECTIONS: Record<Locale, Direction> = {
  ar: 'rtl',
  en: 'ltr',
};

/** Nested translation dictionaries, keyed by locale. */
export const translations: Record<Locale, Record<string, unknown>> = {
  ar,
  en,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve a dot-separated key (e.g. "common.save") in a nested dictionary.
 * Returns undefined when the key does not resolve to a string.
 */
export function resolveKey(dict: Record<string, unknown>, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node !== null && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}
