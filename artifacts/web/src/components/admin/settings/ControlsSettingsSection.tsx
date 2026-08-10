import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { ControlsSettings } from '@/services/adminSettings';
import { useUpdateControlsSettings } from '@/hooks/useAdminSettings';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  settings: ControlsSettings;
  onDirtyChange: (dirty: boolean) => void;
}

const CONTROL_KEYS: Array<keyof ControlsSettings> = [
  'maintenance_mode',
  'allow_registrations',
  'allow_event_registrations',
  'allow_volunteer_applications',
  'show_donations',
  'show_partners',
  'show_faqs',
];

export function ControlsSettingsSection({ settings, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateControlsSettings();

  const [form, setForm] = useState<ControlsSettings>({ ...settings });
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const toggle = (key: keyof ControlsSettings, checked: boolean) => {
    // Activating maintenance mode needs explicit confirmation.
    if (key === 'maintenance_mode' && checked) {
      setConfirmMaintenance(true);
      return;
    }
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const save = () => {
    mutation.mutate(
      { ...form },
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

  return (
    <SettingsSectionShell
      title={t('admin.settings.sections.controls')}
      description={t('admin.settings.controlsDescription')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={() => setForm({ ...settings })}
      testId="settings-section-controls"
    >
      <div className="space-y-1">
        {CONTROL_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-muted/40"
            data-testid={`control-row-${key}`}
          >
            <div className="min-w-0">
              <Label className="flex items-center gap-1.5 font-medium">
                {key === 'maintenance_mode' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : null}
                {t(`admin.settings.controls.${key}`)}
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(`admin.settings.controls.${key}_hint`)}
              </p>
            </div>
            <Switch
              checked={form[key]}
              onCheckedChange={(checked) => toggle(key, checked)}
              data-testid={`switch-control-${key}`}
            />
          </div>
        ))}
      </div>

      <GalleryConfirmDialog
        open={confirmMaintenance}
        onOpenChange={setConfirmMaintenance}
        isPending={false}
        title={t('admin.settings.maintenanceConfirmTitle')}
        description={t('admin.settings.maintenanceConfirmDescription')}
        actionLabel={t('admin.settings.maintenanceConfirmAction')}
        destructive
        testId="dialog-confirm-maintenance"
        onConfirm={() => {
          setForm((prev) => ({ ...prev, maintenance_mode: true }));
          setConfirmMaintenance(false);
        }}
      />
    </SettingsSectionShell>
  );
}
