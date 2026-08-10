import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { EmailSettings } from '@/services/adminSettings';
import { useUpdateEmailSettings } from '@/hooks/useAdminSettings';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';
import { isValidEmail } from '@/components/admin/settings/settingsValidation';

interface Props {
  settings: EmailSettings;
  onDirtyChange: (dirty: boolean) => void;
}

type Errors = Partial<Record<keyof EmailSettings, string>>;

/**
 * Sender display configuration only. SMTP host/port/credentials are
 * configured securely on the Laravel side and never reach this UI.
 */
export function EmailSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateEmailSettings();

  const [form, setForm] = useState<EmailSettings>({ ...settings });
  const [errors, setErrors] = useState<Errors>({});

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const reset = () => {
    setForm({ ...settings });
    setErrors({});
  };

  const save = () => {
    const nextErrors: Errors = {};
    if (!form.sender_name.trim()) {
      nextErrors.sender_name = t('admin.settings.required');
    }
    if (!isValidEmail(form.sender_email)) {
      nextErrors.sender_email = t('admin.settings.invalidEmail');
    }
    if (!isValidEmail(form.reply_to_email)) {
      nextErrors.reply_to_email = t('admin.settings.invalidEmail');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(
      {
        sender_name: form.sender_name.trim(),
        sender_email: form.sender_email.trim(),
        reply_to_email: form.reply_to_email.trim(),
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

  const field = (key: keyof EmailSettings, label: string, type = 'text') => (
    <div className="space-y-1.5">
      <Label htmlFor={`email-${key}`}>{label}</Label>
      <Input
        id={`email-${key}`}
        dir={type === 'email' ? 'ltr' : undefined}
        type={type}
        value={form[key]}
        onChange={(event) => {
          setForm((prev) => ({ ...prev, [key]: event.target.value }));
          setErrors((prev) =>
            prev[key] ? { ...prev, [key]: undefined } : prev,
          );
        }}
        data-testid={`input-email-${key}`}
      />
      {errors[key] ? (
        <p className="text-sm text-destructive" data-testid={`error-email-${key}`}>
          {errors[key]}
        </p>
      ) : null}
    </div>
  );

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.email')}
      description={t('admin.settings.emailDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="settings-section-email"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {field('sender_name', t('admin.settings.senderName'))}
        {field('sender_email', t('admin.settings.senderEmail'), 'email')}
        {field('reply_to_email', t('admin.settings.replyToEmail'), 'email')}
      </div>
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          {t('admin.settings.smtpNotice')}
        </p>
      </div>
    </SettingsSectionShell>
  );
}
