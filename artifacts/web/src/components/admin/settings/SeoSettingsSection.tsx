import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { getApiError } from '@/services/api';
import {
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  type SeoSettings,
} from '@/services/adminSettings';
import { useUpdateSeoSettings } from '@/hooks/useAdminSettings';
import {
  EMPTY_IMAGE_VALUE,
  SettingsImageField,
  type ImageFieldValue,
} from '@/components/admin/settings/SettingsImageField';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  settings: SeoSettings;
  onDirtyChange: (dirty: boolean) => void;
}

type FormState = Omit<SeoSettings, 'og_image_url'>;

const toForm = (settings: SeoSettings): FormState => ({
  meta_title_ar: settings.meta_title_ar,
  meta_title_en: settings.meta_title_en,
  meta_description_ar: settings.meta_description_ar,
  meta_description_en: settings.meta_description_en,
  keywords: settings.keywords,
});

export function SeoSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateSeoSettings();

  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [ogImage, setOgImage] = useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(toForm(settings)) ||
    ogImage.file !== null ||
    ogImage.removeExisting;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const reset = () => {
    setForm(toForm(settings));
    setOgImage(EMPTY_IMAGE_VALUE);
  };

  const save = () => {
    mutation.mutate(
      {
        input: {
          meta_title_ar: form.meta_title_ar.trim(),
          meta_title_en: form.meta_title_en.trim(),
          meta_description_ar: form.meta_description_ar.trim(),
          meta_description_en: form.meta_description_en.trim(),
          keywords: form.keywords.trim(),
        },
        files: {
          og_image: ogImage.file,
          remove_og_image: ogImage.removeExisting,
        },
      },
      {
        onSuccess: () => {
          setOgImage(EMPTY_IMAGE_VALUE);
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

  const counter = (value: string, max: number) => (
    <span
      className={cn(
        'text-xs tabular-nums',
        value.length > max ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {value.length}/{max}
    </span>
  );

  const titleField = (key: 'meta_title_ar' | 'meta_title_en', dir: 'rtl' | 'ltr') => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`seo-${key}`}>{t(`admin.settings.${key}`)}</Label>
        {counter(form[key], SEO_TITLE_MAX)}
      </div>
      <Input
        id={`seo-${key}`}
        dir={dir}
        maxLength={SEO_TITLE_MAX}
        value={form[key]}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [key]: event.target.value }))
        }
        data-testid={`input-seo-${key}`}
      />
    </div>
  );

  const descriptionField = (
    key: 'meta_description_ar' | 'meta_description_en',
    dir: 'rtl' | 'ltr',
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`seo-${key}`}>{t(`admin.settings.${key}`)}</Label>
        {counter(form[key], SEO_DESCRIPTION_MAX)}
      </div>
      <Textarea
        id={`seo-${key}`}
        dir={dir}
        rows={3}
        maxLength={SEO_DESCRIPTION_MAX}
        value={form[key]}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [key]: event.target.value }))
        }
        data-testid={`input-seo-${key}`}
      />
    </div>
  );

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.seo')}
      description={t('admin.settings.seoDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-seo"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {titleField('meta_title_ar', 'rtl')}
        {titleField('meta_title_en', 'ltr')}
        {descriptionField('meta_description_ar', 'rtl')}
        {descriptionField('meta_description_en', 'ltr')}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seo-keywords">{t('admin.settings.keywords')}</Label>
        <Input
          id="seo-keywords"
          value={form.keywords}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, keywords: event.target.value }))
          }
          placeholder={t('admin.settings.keywordsPlaceholder')}
          data-testid="input-seo-keywords"
        />
      </div>
      <SettingsImageField
        label={t('admin.settings.ogImage')}
        existingUrl={settings.og_image_url}
        value={ogImage}
        onChange={setOgImage}
        testId="image-seo-og"
      />
    </SettingsSectionShell>
  );
}
