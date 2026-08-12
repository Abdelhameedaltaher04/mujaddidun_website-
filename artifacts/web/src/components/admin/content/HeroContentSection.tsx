import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { HeroContent } from '@/services/adminContent';
import { useUpdateHeroContent } from '@/hooks/useAdminContent';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';
import {
  ContentImageField,
  EMPTY_CONTENT_IMAGE,
  type ContentImageValue,
} from '@/components/admin/content/ContentImageField';

interface Props {
  content: HeroContent;
  onDirtyChange: (dirty: boolean) => void;
}

type FormState = Omit<HeroContent, 'background_image_url'>;

const toForm = (content: HeroContent): FormState => {
  const { background_image_url: _unused, ...rest } = content;
  return { ...rest };
};

export function HeroContentSection({ content, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateHeroContent();

  const [form, setForm] = useState<FormState>(() => toForm(content));
  const [image, setImage] = useState<ContentImageValue>(EMPTY_CONTENT_IMAGE);

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(toForm(content)) ||
    image.file !== null ||
    image.removeExisting;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(toForm(content));
    setImage(EMPTY_CONTENT_IMAGE);
  };

  const save = () => {
    mutation.mutate(
      {
        input: form,
        files: {
          background_image: image.file,
          remove_background_image: image.removeExisting,
        },
      },
      {
        onSuccess: () => {
          setImage(EMPTY_CONTENT_IMAGE);
          toast({ description: t('admin.content.saveSuccess') });
        },
        onError: (error) =>
          toast({
            variant: 'destructive',
            description:
              getApiError(error).message || t('admin.content.saveError'),
          }),
      },
    );
  };

  const textField = (
    key: keyof FormState,
    label: string,
    dir: 'rtl' | 'ltr',
    multiline = false,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`hero-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`hero-${key}`}
          dir={dir}
          rows={3}
          value={form[key] as string}
          onChange={(event) => set(key, event.target.value as FormState[typeof key])}
          data-testid={`input-hero-${key}`}
        />
      ) : (
        <Input
          id={`hero-${key}`}
          dir={dir}
          value={form[key] as string}
          onChange={(event) => set(key, event.target.value as FormState[typeof key])}
          data-testid={`input-hero-${key}`}
        />
      )}
    </div>
  );

  return (
    <SettingsSectionShell
      title={t('admin.content.tabs.hero')}
      description={t('admin.content.hero.description')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="content-section-hero"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {textField('title_ar', t('admin.content.hero.titleAr'), 'rtl')}
        {textField('title_en', t('admin.content.hero.titleEn'), 'ltr')}
        {textField(
          'description_ar',
          t('admin.content.hero.descriptionAr'),
          'rtl',
          true,
        )}
        {textField(
          'description_en',
          t('admin.content.hero.descriptionEn'),
          'ltr',
          true,
        )}
        {textField(
          'primary_button_text_ar',
          t('admin.content.hero.primaryButtonTextAr'),
          'rtl',
        )}
        {textField(
          'primary_button_text_en',
          t('admin.content.hero.primaryButtonTextEn'),
          'ltr',
        )}
        <div className="md:col-span-2">
          {textField(
            'primary_button_url',
            t('admin.content.hero.primaryButtonUrl'),
            'ltr',
          )}
        </div>
        {textField(
          'secondary_button_text_ar',
          t('admin.content.hero.secondaryButtonTextAr'),
          'rtl',
        )}
        {textField(
          'secondary_button_text_en',
          t('admin.content.hero.secondaryButtonTextEn'),
          'ltr',
        )}
        <div className="md:col-span-2">
          {textField(
            'secondary_button_url',
            t('admin.content.hero.secondaryButtonUrl'),
            'ltr',
          )}
        </div>
      </div>

      <ContentImageField
        label={t('admin.content.hero.backgroundImage')}
        existingUrl={content.background_image_url}
        value={image}
        onChange={setImage}
        testId="image-hero-background"
      />

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <Label className="font-medium">{t('admin.content.isActive')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('admin.content.isActiveHint')}
          </p>
        </div>
        <Switch
          checked={form.is_active}
          onCheckedChange={(is_active) => set('is_active', is_active)}
          data-testid="switch-hero-active"
        />
      </div>
    </SettingsSectionShell>
  );
}
