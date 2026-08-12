import { useQuery } from '@tanstack/react-query';
import { fetchPublicContent, type PublicContent } from '@/services/publicContent';

/**
 * Public website content (hero, about, vision/mission, footer,
 * statistics, CTAs, homepage section visibility/order). Cached like
 * usePublicSettings; consumers must tolerate `undefined` while loading
 * and fall back to the bundled translation defaults so the page renders
 * even if the API is unreachable.
 */
export function usePublicContent(): PublicContent | undefined {
  const { data } = useQuery({
    queryKey: ['public-content'],
    queryFn: fetchPublicContent,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data;
}
