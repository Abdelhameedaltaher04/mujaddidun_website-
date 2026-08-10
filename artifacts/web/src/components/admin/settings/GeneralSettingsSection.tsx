import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { GeneralSettings } from '@/services/adminSettings';
import { useUpdateGeneralSettings } from '@/hooks/useAdminSettings';
import {
  EMPTY_IMAGE_VALUE,
  SettingsImageField,
  type ImageFieldValue,
} from '@/components/admin/settings/SettingsImageField';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  settings: GeneralSettings;
  onDirtyChange: (dirty: boolean) => void;
}

interface FormState {
  site_name_ar: string;
  site_name_en: string;
  description_ar: string;
  description_en: string;
}

const toForm = (settings: GeneralSettings): FormState => ({
  site_name_ar: settings.site_name_ar,
  site_name_en: settings.site_name_en,
  description_ar: settings.description_ar,
  description_en: settings.description_en,
});

export function GeneralSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateGeneralSettings();

  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [logo, setLogo] = useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);
  const [favicon, setFavicon] = useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(toForm(settings)) ||
    logo.file !== null ||
    logo.removeExisting ||
    favicon.file !== null ||
    favicon.removeExisting;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const reset = () => {
    setForm(toForm(settings));
    setLogo(EMPTY_IMAGE_VALUE);
    setFavicon(EMPTY_IMAGE_VALUE);
    setErrors({});
  };

  const save = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.site_name_ar.trim()) {
      nextErrors.site_name_ar = t('admin.settings.required');
    }
    if (!form.site_name_en.trim()) {
      nextErrors.site_name_en = t('admin.settings.required');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(
      {
        input: {
          site_name_ar: form.site_name_ar.trim(),
          site_name_en: form.site_name_en.trim(),
          description_ar: form.description_ar.trim(),
          description_en: form.description_en.trim(),
        },
        files: {
          logo: logo.file,
          remove_logo: logo.removeExisting,
          favicon: favicon.file,
          remove_favicon: favicon.removeExisting,
        },
      },
      {
        onSuccess: () => {
          setLogo(EMPTY_IMAGE_VALUE);
          setFavicon(EMPTY_IMAGE_VALUE);
          toast({ description: t('admin.settings.saveSuccess') });
        },
        onError: (error) =>
          toast({
            variant: 'destructive',
            description:
              getApiError(error).message || t('admin.settings.saveError'),
          }),
      },
    );
  };

  const field = (
    key: keyof FormState,
    label: string,
    dir: 'rtl' | 'ltr',
    multiline = false,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`general-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`general-${key}`}
          dir={dir}
          rows={3}
          value={form[key]}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, [key]: event.target.value }))
          }
          data-testid={`input-general-${key}`}
        />
      ) : (
        <Input
          id={`general-${key}`}
          dir={dir}
          value={form[key]}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, [key]: event.target.value }))
          }
          data-testid={`input-general-${key}`}
        />
      )}
      {errors[key] ? (
        <p className="text-sm text-destructive">{errors[key]}</p>
      ) : null}
    </div>
  );

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.general')}
      description={t('admin.settings.generalDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-general"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {field('site_name_ar', t('admin.settings.siteNameAr'), 'rtl')}
        {field('site_name_en', t('admin.settings.siteNameEn'), 'ltr')}
        {field(
          'description_ar',
          t('admin.settings.descriptionAr'),
          'rtl',
          true,
        )}
        {field(
          'description_en',
          t('admin.settings.descriptionEn'),
          'ltr',
          true,
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SettingsImageField
          label={t('admin.settings.logo')}
          existingUrl={settings.logo_url}
          value={logo}
          onChange={setLogo}
          testId="image-general-logo"
        />
        <SettingsImageField
          label={t('admin.settings.favicon')}
          existingUrl={settings.favicon_url}
          value={favicon}
          onChange={setFavicon}
          testId="image-general-favicon"
        />
      </div>
    </SettingsSectionShell>
  );
}
