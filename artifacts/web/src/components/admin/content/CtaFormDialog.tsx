import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import type { CtaFiles, CtaInput, CtaSection } from '@/services/adminContent';
import {
  ContentImageField,
  EMPTY_CONTENT_IMAGE,
  type ContentImageValue,
} from '@/components/admin/content/ContentImageField';

interface Props {
  cta: CtaSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: CtaInput, files: CtaFiles) => void;
}

const toForm = (cta: CtaSection | null): CtaInput =>
  cta
    ? {
        title_ar: cta.title_ar,
        title_en: cta.title_en,
        description_ar: cta.description_ar ?? '',
        description_en: cta.description_en ?? '',
        button_text_ar: cta.button_text_ar ?? '',
        button_text_en: cta.button_text_en ?? '',
        button_url: cta.button_url ?? '',
        is_active: cta.is_active,
      }
    : {
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        button_text_ar: '',
        button_text_en: '',
        button_url: '',
        is_active: true,
      };

export function CtaFormDialog({
  cta,
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: Props) {
  const { t } = useLocale();
  const [form, setForm] = useState<CtaInput>(() => toForm(cta));
  const [image, setImage] = useState<ContentImageValue>(EMPTY_CONTENT_IMAGE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(cta));
      setImage(EMPTY_CONTENT_IMAGE);
      setError(null);
    }
  }, [open, cta]);

  const set = <K extends keyof CtaInput>(key: K, value: CtaInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!form.title_ar.trim() || !form.title_en.trim()) {
      setError(t('admin.content.required'));
      return;
    }
    setError(null);
    onSubmit(
      {
        title_ar: form.title_ar.trim(),
        title_en: form.title_en.trim(),
        description_ar: form.description_ar.trim(),
        description_en: form.description_en.trim(),
        button_text_ar: form.button_text_ar.trim(),
        button_text_en: form.button_text_en.trim(),
        button_url: form.button_url.trim(),
        is_active: form.is_active,
      },
      { image: image.file, remove_image: image.removeExisting },
    );
  };

  const textField = (
    key: keyof CtaInput,
    label: string,
    dir: 'rtl' | 'ltr',
    multiline = false,
    testId = `input-cta-${key}`,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`cta-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`cta-${key}`}
          dir={dir}
          rows={2}
          value={form[key] as string}
          onChange={(event) => set(key, event.target.value as CtaInput[typeof key])}
          data-testid={testId}
        />
      ) : (
        <Input
          id={`cta-${key}`}
          dir={dir}
          value={form[key] as string}
          onChange={(event) => set(key, event.target.value as CtaInput[typeof key])}
          data-testid={testId}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        data-testid="dialog-cta-form"
      >
        <DialogHeader>
          <DialogTitle>
            {cta ? t('admin.content.ctas.editTitle') : t('admin.content.ctas.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.content.ctas.formDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('title_ar', t('admin.content.ctas.titleAr'), 'rtl')}
            {textField('title_en', t('admin.content.ctas.titleEn'), 'ltr')}
            {textField('description_ar', t('admin.content.ctas.descriptionAr'), 'rtl', true)}
            {textField('description_en', t('admin.content.ctas.descriptionEn'), 'ltr', true)}
            {textField('button_text_ar', t('admin.content.ctas.buttonTextAr'), 'rtl')}
            {textField('button_text_en', t('admin.content.ctas.buttonTextEn'), 'ltr')}
          </div>
          {textField('button_url', t('admin.content.ctas.buttonUrl'), 'ltr')}

          <ContentImageField
            label={t('admin.content.ctas.image')}
            existingUrl={cta?.image_url ?? null}
            value={image}
            onChange={setImage}
            testId="image-cta"
          />

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="font-medium">{t('admin.content.isActive')}</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(is_active) => set('is_active', is_active)}
              data-testid="switch-cta-active"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" data-testid="error-cta-form">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-cancel-cta"
          >
            {t('admin.content.cancel')}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isSaving}
            data-testid="button-submit-cta"
          >
            {isSaving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
            {t('admin.content.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
