import { useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type SocialSettings,
} from '@/services/adminSettings';
import { useUpdateSocialSettings } from '@/hooks/useAdminSettings';
import { CountryPhoneField } from '@/components/forms/CountryPhoneField';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';
import { isValidHttpUrl } from '@/components/admin/settings/settingsValidation';

interface Props {
  settings: SocialSettings;
  onDirtyChange: (dirty: boolean) => void;
}

const PLATFORM_ICONS: Record<SocialPlatform, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: MessageCircle,
};

const clone = (value: SocialSettings): SocialSettings =>
  JSON.parse(JSON.stringify(value));

export function SocialSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateSocialSettings();

  const [form, setForm] = useState<SocialSettings>(() => clone(settings));
  const [errors, setErrors] = useState<Partial<Record<SocialPlatform, string>>>(
    {},
  );

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const setPlatform = (
    platform: SocialPlatform,
    patch: Partial<SocialSettings[SocialPlatform]>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...patch },
    }));
    setErrors((prev) =>
      prev[platform] ? { ...prev, [platform]: undefined } : prev,
    );
  };

  const reset = () => {
    setForm(clone(settings));
    setErrors({});
  };

  const save = () => {
    const nextErrors: Partial<Record<SocialPlatform, string>> = {};
    SOCIAL_PLATFORMS.forEach((platform) => {
      const { value, enabled } = form[platform];
      if (!enabled && !value.trim()) return;
      if (platform === 'whatsapp') {
        if (enabled && (!value.trim() || !isValidPhoneNumber(value))) {
          nextErrors[platform] = t('admin.settings.invalidPhone');
        }
      } else if (enabled && !isValidHttpUrl(value)) {
        nextErrors[platform] = t('admin.settings.invalidUrl');
      } else if (!enabled && value.trim() && !isValidHttpUrl(value)) {
        nextErrors[platform] = t('admin.settings.invalidUrl');
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(clone(form), {
      onSuccess: () => toast({ description: t('admin.settings.saveSuccess') }),
      onError: (error) =>
        toast({
          variant: 'destructive',
          description:
            getApiError(error).message || t('admin.settings.saveError'),
        }),
    });
  };

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.social')}
      description={t('admin.settings.socialDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-social"
    >
      <div className="space-y-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const Icon = PLATFORM_ICONS[platform];
          const entry = form[platform];
          return (
            <div
              key={platform}
              className="rounded-lg border border-border p-4"
              data-testid={`social-row-${platform}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Label className="font-medium">
                    {t(`admin.settings.platforms.${platform}`)}
                  </Label>
                </div>
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={(enabled) =>
                    setPlatform(platform, { enabled })
                  }
                  data-testid={`switch-social-${platform}`}
                />
              </div>
              <div className="mt-3">
                {platform === 'whatsapp' ? (
                  <CountryPhoneField
                    value={entry.value}
                    onChange={(value) => setPlatform(platform, { value })}
                    disabled={!entry.enabled}
                    id="settings-social-whatsapp"
                    inputTestId="input-social-whatsapp"
                    selectorTestId="selector-social-whatsapp"
                  />
                ) : (
                  <Input
                    dir="ltr"
                    placeholder={`https://${platform}.com/...`}
                    value={entry.value}
                    disabled={!entry.enabled}
                    onChange={(event) =>
                      setPlatform(platform, { value: event.target.value })
                    }
                    data-testid={`input-social-${platform}`}
                  />
                )}
                {errors[platform] ? (
                  <p
                    className="mt-1.5 text-sm text-destructive"
                    data-testid={`error-social-${platform}`}
                  >
                    {errors[platform]}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </SettingsSectionShell>
  );
}
