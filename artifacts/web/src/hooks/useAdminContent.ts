import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminContentApi,
  type AboutContent,
  type CtaFiles,
  type CtaInput,
  type FooterContent,
  type HeroContent,
  type HomepageSectionKey,
  type StatisticInput,
  type VisionMissionContent,
  type WebsiteContent,
} from '@/services/adminContent';

const KEY = ['admin', 'content'] as const;

export function useWebsiteContent() {
  return useQuery({ queryKey: KEY, queryFn: () => adminContentApi.get() });
}

/** The public homepage/footer read this key — keep it in sync with edits. */
const PUBLIC_KEY = ['public-content'] as const;

function useApplyContent() {
  const queryClient = useQueryClient();
  return (updated: WebsiteContent) => {
    queryClient.setQueryData(KEY, updated);
    queryClient.invalidateQueries({ queryKey: PUBLIC_KEY });
  };
}

/** Statistics / CTA / section mutations return partial data → refetch. */
function useInvalidateContent() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: PUBLIC_KEY });
  };
}

export function useUpdateHeroContent() {
  const apply = useApplyContent();
  return useMutation({
    mutationFn: (payload: {
      input: Omit<HeroContent, 'background_image_url'>;
      files: { background_image?: File | null; remove_background_image?: boolean };
    }) => adminContentApi.updateHero(payload.input, payload.files),
    onSuccess: apply,
  });
}

export function useUpdateAboutContent() {
  const apply = useApplyContent();
  return useMutation({
    mutationFn: (payload: {
      input: Omit<AboutContent, 'image_url'>;
      files: { image?: File | null; remove_image?: boolean };
    }) => adminContentApi.updateAbout(payload.input, payload.files),
    onSuccess: apply,
  });
}

export function useUpdateVisionMissionContent() {
  const apply = useApplyContent();
  return useMutation({
    mutationFn: (input: VisionMissionContent) =>
      adminContentApi.updateVisionMission(input),
    onSuccess: apply,
  });
}

export function useUpdateFooterContent() {
  const apply = useApplyContent();
  return useMutation({
    mutationFn: (input: FooterContent) => adminContentApi.updateFooter(input),
    onSuccess: apply,
  });
}

export function useCreateStatistic() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (input: StatisticInput) => adminContentApi.createStatistic(input),
    onSuccess: invalidate,
  });
}

export function useUpdateStatistic() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (payload: { id: number; input: StatisticInput }) =>
      adminContentApi.updateStatistic(payload.id, payload.input),
    onSuccess: invalidate,
  });
}

export function useDeleteStatistic() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: number) => adminContentApi.deleteStatistic(id),
    onSuccess: invalidate,
  });
}

export function useReorderStatistics() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (ids: number[]) => adminContentApi.reorderStatistics(ids),
    onSuccess: invalidate,
  });
}

export function useCreateCta() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (payload: { input: CtaInput; files: CtaFiles }) =>
      adminContentApi.createCta(payload.input, payload.files),
    onSuccess: invalidate,
  });
}

export function useUpdateCta() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (payload: { id: number; input: CtaInput; files: CtaFiles }) =>
      adminContentApi.updateCta(payload.id, payload.input, payload.files),
    onSuccess: invalidate,
  });
}

export function useDeleteCta() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: number) => adminContentApi.deleteCta(id),
    onSuccess: invalidate,
  });
}

export function useReorderCtas() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (ids: number[]) => adminContentApi.reorderCtas(ids),
    onSuccess: invalidate,
  });
}

export function useUpdateHomepageSections() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (
      sections: Array<{ section_key: HomepageSectionKey; is_visible: boolean }>,
    ) => adminContentApi.updateHomepageSections(sections),
    onSuccess: invalidate,
  });
}
