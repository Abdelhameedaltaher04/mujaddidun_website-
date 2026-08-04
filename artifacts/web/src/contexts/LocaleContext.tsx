import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  DIRECTIONS,
  isLocale,
  resolveKey,
  translations,
  type Direction,
  type Locale,
} from '@/i18n';

const STORAGE_KEY = 'locale';

interface LocaleContextValue {
  /** Current locale ("ar" or "en"). */
  locale: Locale;
  /** Text direction for the current locale. */
  dir: Direction;
  /** Change the active locale (persists to localStorage). */
  setLocale: (locale: Locale) => void;
  /** Toggle between Arabic and English. */
  toggleLocale: () => void;
  /**
   * Translate a dot-separated key, e.g. t('common.save').
   * Supports {placeholder} interpolation via params.
   * Falls back to the default locale, then to the key itself.
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_LOCALE;
}

function interpolate(
  text: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const dir = DIRECTIONS[locale];

  // Keep <html lang> and <html dir> in sync so the whole page flips direction.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const text =
        resolveKey(translations[locale], key) ??
        resolveKey(translations[DEFAULT_LOCALE], key) ??
        key;
      return interpolate(text, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir, setLocale, toggleLocale, t }),
    [locale, dir, setLocale, toggleLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
