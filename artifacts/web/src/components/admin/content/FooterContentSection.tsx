import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { FooterContent } from '@/services/adminContent';
import { useUpdateFooterContent } from '@/hooks/useAdminContent';
import { SettingsSectionShell } from '@/components/admin/settings/SettingsSectionShell';

interface Props {
  content: FooterContent;
  onDirtyChange: (dirty: boolean) => void;
}

export function FooterContentSection({ content, onDirtyChange }: Props) {
  const { t } = useLocale();
  const { toast } = useToast();
  const mutation = useUpdateFooterContent();

  const [form, setForm] = useState<FooterContent>({ ...content });

  const isDirty = JSON.stringify(form) !== JSON.stringify(content);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const set = <K extends keyof FooterContent>(
    key: K,
    value: FooterContent[K],
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

  return (
    <SettingsSectionShell
      title={t('admin.content.tabs.footer')}
      description={t('admin.content.footer.description')}
      isDirty={isDirty}
      isPending={mutation.isPending}
      onSave={save}
      onReset={reset}
      testId="content-section-footer"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="footer-description-ar">
            {t('admin.content.footer.descriptionAr')}
          </Label>
          <Textarea
            id="footer-description-ar"
            dir="rtl"
            rows={3}
            value={form.description_ar}
            onChange={(event) => set('description_ar', event.target.value)}
            data-testid="input-footer-description-ar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footer-description-en">
            {t('admin.content.footer.descriptionEn')}
          </Label>
          <Textarea
            id="footer-description-en"
            dir="ltr"
            rows={3}
            value={form.description_en}
            onChange={(event) => set('description_en', event.target.value)}
            data-testid="input-footer-description-en"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footer-copyright-ar">
            {t('admin.content.footer.copyrightAr')}
          </Label>
          <Input
            id="footer-copyright-ar"
            dir="rtl"
            value={form.copyright_ar}
            onChange={(event) => set('copyright_ar', event.target.value)}
            data-testid="input-footer-copyright-ar"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.content.footer.copyrightHint')}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footer-copyright-en">
            {t('admin.content.footer.copyrightEn')}
          </Label>
          <Input
            id="footer-copyright-en"
            dir="ltr"
            value={form.copyright_en}
            onChange={(event) => set('copyright_en', event.target.value)}
            data-testid="input-footer-copyright-en"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.content.footer.copyrightHint')}
          </p>
        </div>
      </div>
    </SettingsSectionShell>
  );
}
