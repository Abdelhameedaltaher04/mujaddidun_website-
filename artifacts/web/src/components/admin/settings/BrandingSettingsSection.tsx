import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { BrandingSettings } from '@/services/adminSettings';
import { useUpdateBrandingSettings } from '@/hooks/useAdminSettings';
import {
  EMPTY_IMAGE_VALUE,
  SettingsImageField,
  type ImageFieldValue,
} from '@/components/admin/settings/SettingsImageField';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  settings: BrandingSettings;
  onDirtyChange: (dirty: boolean) => void;
}

export function BrandingSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateBrandingSettings();

  const [title, setTitle] = useState(settings.website_title);
  const [language, setLanguage] = useState<'ar' | 'en'>(
    settings.default_language,
  );
  const [primaryLogo, setPrimaryLogo] =
    useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);
  const [footerLogo, setFooterLogo] =
    useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);
  const [favicon, setFavicon] = useState<ImageFieldValue>(EMPTY_IMAGE_VALUE);
  const [titleError, setTitleError] = useState<string | null>(null);

  const imageDirty = (value: ImageFieldValue) =>
    value.file !== null || value.removeExisting;
  const isDirty =
    title !== settings.website_title ||
    language !== settings.default_language ||
    imageDirty(primaryLogo) ||
    imageDirty(footerLogo) ||
    imageDirty(favicon);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const reset = () => {
    setTitle(settings.website_title);
    setLanguage(settings.default_language);
    setPrimaryLogo(EMPTY_IMAGE_VALUE);
    setFooterLogo(EMPTY_IMAGE_VALUE);
    setFavicon(EMPTY_IMAGE_VALUE);
    setTitleError(null);
  };

  const save = () => {
    if (!title.trim()) {
      setTitleError(t('admin.settings.required'));
      return;
    }
    setTitleError(null);
    mutation.mutate(
      {
        input: { website_title: title.trim(), default_language: language },
        files: {
          primary_logo: primaryLogo.file,
          remove_primary_logo: primaryLogo.removeExisting,
          footer_logo: footerLogo.file,
          remove_footer_logo: footerLogo.removeExisting,
          favicon: favicon.file,
          remove_favicon: favicon.removeExisting,
        },
      },
      {
        onSuccess: () => {
          setPrimaryLogo(EMPTY_IMAGE_VALUE);
          setFooterLogo(EMPTY_IMAGE_VALUE);
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

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.branding')}
      description={t('admin.settings.brandingDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-branding"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="branding-title">
            {t('admin.settings.websiteTitle')}
          </Label>
          <Input
            id="branding-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            data-testid="input-branding-title"
          />
          {titleError ? (
            <p className="text-sm text-destructive">{titleError}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>{t('admin.settings.defaultLanguage')}</Label>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as 'ar' | 'en')}
          >
            <SelectTrigger data-testid="select-branding-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">{t('admin.settings.arabic')}</SelectItem>
              <SelectItem value="en">{t('admin.settings.english')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SettingsImageField
          label={t('admin.settings.primaryLogo')}
          existingUrl={settings.primary_logo_url}
          value={primaryLogo}
          onChange={setPrimaryLogo}
          testId="image-branding-primary-logo"
        />
        <SettingsImageField
          label={t('admin.settings.footerLogo')}
          existingUrl={settings.footer_logo_url}
          value={footerLogo}
          onChange={setFooterLogo}
          testId="image-branding-footer-logo"
        />
        <SettingsImageField
          label={t('admin.settings.favicon')}
          existingUrl={settings.favicon_url}
          value={favicon}
          onChange={setFavicon}
          testId="image-branding-favicon"
        />
      </div>
    </SettingsSectionShell>
  );
}
