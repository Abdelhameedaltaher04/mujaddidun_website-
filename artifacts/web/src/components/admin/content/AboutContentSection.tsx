import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { AboutContent } from '@/services/adminContent';
import { useUpdateAboutContent } from '@/hooks/useAdminContent';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';
import {
  ContentImageField,
  EMPTY_CONTENT_IMAGE,
  type ContentImageValue,
} from '@/components/admin/content/ContentImageField';

interface Props {
  content: AboutContent;
  onDirtyChange: (dirty: boolean) => void;
}

type FormState = Omit<AboutContent, 'image_url'>;

const toForm = (content: AboutContent): FormState => {
  const { image_url: _unused, ...rest } = content;
  return { ...rest };
};

export function AboutContentSection({ content, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateAboutContent();

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
        files: { image: image.file, remove_image: image.removeExisting },
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

  return (
    <SettingsSectionShell
      title={t('admin.content.tabs.about')}
      description={t('admin.content.about.description')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="content-section-about"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="about-title-ar">
            {t('admin.content.about.titleAr')}
          </Label>
          <Input
            id="about-title-ar"
            dir="rtl"
            value={form.title_ar}
            onChange={(event) => set('title_ar', event.target.value)}
            data-testid="input-about-title-ar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about-title-en">
            {t('admin.content.about.titleEn')}
          </Label>
          <Input
            id="about-title-en"
            dir="ltr"
            value={form.title_en}
            onChange={(event) => set('title_en', event.target.value)}
            data-testid="input-about-title-en"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about-description-ar">
            {t('admin.content.about.descriptionAr')}
          </Label>
          <Textarea
            id="about-description-ar"
            dir="rtl"
            rows={4}
            value={form.description_ar}
            onChange={(event) => set('description_ar', event.target.value)}
            data-testid="input-about-description-ar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about-description-en">
            {t('admin.content.about.descriptionEn')}
          </Label>
          <Textarea
            id="about-description-en"
            dir="ltr"
            rows={4}
            value={form.description_en}
            onChange={(event) => set('description_en', event.target.value)}
            data-testid="input-about-description-en"
          />
        </div>
      </div>

      <ContentImageField
        label={t('admin.content.about.image')}
        existingUrl={content.image_url}
        value={image}
        onChange={setImage}
        testId="image-about"
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
          data-testid="switch-about-active"
        />
      </div>
    </SettingsSectionShell>
  );
}
