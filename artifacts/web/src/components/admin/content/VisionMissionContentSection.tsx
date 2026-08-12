import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { VisionMissionContent } from '@/services/adminContent';
import { useUpdateVisionMissionContent } from '@/hooks/useAdminContent';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  content: VisionMissionContent;
  onDirtyChange: (dirty: boolean) => void;
}

export function VisionMissionContentSection({ content, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateVisionMissionContent();

  const [form, setForm] = useState<VisionMissionContent>({ ...content });

  const isDirty = JSON.stringify(form) !== JSON.stringify(content);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const set = <K extends keyof VisionMissionContent>(
    key: K,
    value: VisionMissionContent[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => setForm({ ...content });

  const save = () => {
    mutation.mutate(form, {
      onSuccess: () => toast({ description: t('admin.content.saveSuccess') }),
      onError: (error) =>
        toast({
          variant: 'destructive',
          description: getApiError(error).message || t('admin.content.saveError'),
        }),
    });
  };

  const field = (
    key: keyof VisionMissionContent,
    label: string,
    dir: 'rtl' | 'ltr',
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`vm-${key}`}>{label}</Label>
      <Textarea
        id={`vm-${key}`}
        dir={dir}
        rows={4}
        value={form[key] as string}
        onChange={(event) =>
          set(key, event.target.value as VisionMissionContent[typeof key])
        }
        data-testid={`input-vision-mission-${key}`}
      />
    </div>
  );

  return (
    <SettingsSectionShell
      title={t('admin.content.tabs.vision_mission')}
      description={t('admin.content.visionMission.description')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="content-section-vision-mission"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {field('vision_ar', t('admin.content.visionMission.visionAr'), 'rtl')}
        {field('vision_en', t('admin.content.visionMission.visionEn'), 'ltr')}
        {field('mission_ar', t('admin.content.visionMission.missionAr'), 'rtl')}
        {field('mission_en', t('admin.content.visionMission.missionEn'), 'ltr')}
      </div>

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
          data-testid="switch-vision-mission-active"
        />
      </div>
    </SettingsSectionShell>
  );
}
