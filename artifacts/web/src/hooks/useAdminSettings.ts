import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminSettingsApi,
  type BrandingFiles,
  type BrandingSettings,
  type ContactSettings,
  type ControlsSettings,
  type EmailSettings,
  type GeneralFiles,
  type GeneralSettings,
  type SeoFiles,
  type SeoSettings,
  type SiteSettings,
  type SocialSettings,
} from '@/services/adminSettings';

const KEY = ['admin', 'settings'] as const;

export function useSiteSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => adminSettingsApi.get() });
}

function useApplySettings() {
  const queryClient = useQueryClient();
  return (updated: SiteSettings) => {
    queryClient.setQueryData(KEY, updated);
  };
}

export function useUpdateGeneralSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (payload: {
      input: Omit<GeneralSettings, 'logo_url' | 'favicon_url'>;
      files: GeneralFiles;
    }) => adminSettingsApi.updateGeneral(payload.input, payload.files),
    onSuccess: apply,
  });
}

export function useUpdateContactSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (input: ContactSettings) =>
      adminSettingsApi.updateContact(input),
    onSuccess: apply,
  });
}

export function useUpdateSocialSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (input: SocialSettings) => adminSettingsApi.updateSocial(input),
    onSuccess: apply,
  });
}

export function useUpdateBrandingSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (payload: {
      input: Omit<
        BrandingSettings,
        'primary_logo_url' | 'footer_logo_url' | 'favicon_url'
      >;
      files: BrandingFiles;
    }) => adminSettingsApi.updateBranding(payload.input, payload.files),
    onSuccess: apply,
  });
}

export function useUpdateSeoSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (payload: {
      input: Omit<SeoSettings, 'og_image_url'>;
      files: SeoFiles;
    }) => adminSettingsApi.updateSeo(payload.input, payload.files),
    onSuccess: apply,
  });
}

export function useUpdateEmailSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (input: EmailSettings) => adminSettingsApi.updateEmail(input),
    onSuccess: apply,
  });
}

export function useUpdateControlsSettings() {
  const apply = useApplySettings();
  return useMutation({
    mutationFn: (input: ControlsSettings) =>
      adminSettingsApi.updateControls(input),
    onSuccess: apply,
  });
}
