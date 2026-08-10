import { useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { ContactSettings } from '@/services/adminSettings';
import { useUpdateContactSettings } from '@/hooks/useAdminSettings';
import { CountryPhoneField } from '@/components/forms/CountryPhoneField';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';
import {
  isValidEmail,
  isValidHttpUrl,
} from '@/components/admin/settings/settingsValidation';

interface Props {
  settings: ContactSettings;
  onDirtyChange: (dirty: boolean) => void;
}

type Errors = Partial<Record<keyof ContactSettings, string>>;

export function ContactSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateContactSettings();

  const [form, setForm] = useState<ContactSettings>({ ...settings });
  const [errors, setErrors] = useState<Errors>({});

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const set = <K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the field's stale error as soon as the admin edits it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const reset = () => {
    setForm({ ...settings });
    setErrors({});
  };

  const save = () => {
    const nextErrors: Errors = {};
    if (!form.phone.trim() || !isValidPhoneNumber(form.phone)) {
      nextErrors.phone = t('admin.settings.invalidPhone');
    }
    if (!form.whatsapp.trim() || !isValidPhoneNumber(form.whatsapp)) {
      nextErrors.whatsapp = t('admin.settings.invalidPhone');
    }
    if (!isValidEmail(form.email)) {
      nextErrors.email = t('admin.settings.invalidEmail');
    }
    if (form.maps_url.trim() && !isValidHttpUrl(form.maps_url)) {
      nextErrors.maps_url = t('admin.settings.invalidUrl');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(
      {
        ...form,
        email: form.email.trim(),
        address_ar: form.address_ar.trim(),
        address_en: form.address_en.trim(),
        maps_url: form.maps_url.trim(),
      },
      {
        onSuccess: () => toast({ description: t('admin.settings.saveSuccess') }),
        onError: (error) =>
          toast({
            variant: 'destructive',
            description:
              getApiError(error).message || t('admin.settings.saveError'),
          }),
      },
    );
  };

  const errorText = (key: keyof ContactSettings) =>
    errors[key] ? (
      <p className="text-sm text-destructive" data-testid={`error-contact-${key}`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.contact')}
      description={t('admin.settings.contactDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-contact"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('admin.settings.phone')}</Label>
          <CountryPhoneField
            value={form.phone}
            onChange={(value) => set('phone', value)}
            id="settings-contact-phone"
            inputTestId="input-contact-phone"
            selectorTestId="selector-contact-phone"
          />
          {errorText('phone')}
        </div>
        <div className="space-y-1.5">
          <Label>{t('admin.settings.whatsapp')}</Label>
          <CountryPhoneField
            value={form.whatsapp}
            onChange={(value) => set('whatsapp', value)}
            id="settings-contact-whatsapp"
            inputTestId="input-contact-whatsapp"
            selectorTestId="selector-contact-whatsapp"
          />
          {errorText('whatsapp')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">{t('admin.settings.email')}</Label>
          <Input
            id="contact-email"
            dir="ltr"
            type="email"
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
            data-testid="input-contact-email"
          />
          {errorText('email')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-maps">{t('admin.settings.mapsUrl')}</Label>
          <Input
            id="contact-maps"
            dir="ltr"
            placeholder="https://maps.google.com/..."
            value={form.maps_url}
            onChange={(event) => set('maps_url', event.target.value)}
            data-testid="input-contact-maps-url"
          />
          {errorText('maps_url')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-address-ar">
            {t('admin.settings.addressAr')}
          </Label>
          <Textarea
            id="contact-address-ar"
            dir="rtl"
            rows={2}
            value={form.address_ar}
            onChange={(event) => set('address_ar', event.target.value)}
            data-testid="input-contact-address-ar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-address-en">
            {t('admin.settings.addressEn')}
          </Label>
          <Textarea
            id="contact-address-en"
            dir="ltr"
            rows={2}
            value={form.address_en}
            onChange={(event) => set('address_en', event.target.value)}
            data-testid="input-contact-address-en"
          />
        </div>
      </div>
    </SettingsSectionShell>
  );
}
