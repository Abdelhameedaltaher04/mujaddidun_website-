import { useQuery } from '@tanstack/react-query';
import { publicSettingsApi, type PublicSettings } from '@/services/publicSettings';

/**
 * Sitewide public settings. Cached aggressively — the settings change
 * rarely and many layout components (navbar, footer, floating buttons)
 * share this one query. All consumers must tolerate `undefined` while
 * loading (they fall back to the bundled defaults).
 */
export function usePublicSettings(): PublicSettings | undefined {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: publicSettingsApi.get,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data;
}

/**
 * Only allow plain web links from settings-driven values; anything else
 * (javascript:, data:, etc.) is treated as unsafe and dropped.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/** Normalize a phone number for wa.me links (digits only, no +). */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 6 ? digits : null;
}
