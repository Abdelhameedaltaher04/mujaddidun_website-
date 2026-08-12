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
import { useLocale } from '@/contexts/LocaleContext';
import type { SiteStatistic, StatisticInput } from '@/services/adminContent';

interface Props {
  statistic: SiteStatistic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: StatisticInput) => void;
}

const EMPTY: StatisticInput = {
  number: '',
  label_ar: '',
  label_en: '',
  icon: '',
  is_active: true,
};

const toForm = (statistic: SiteStatistic | null): StatisticInput =>
  statistic
    ? {
        number: statistic.number,
        label_ar: statistic.label_ar,
        label_en: statistic.label_en,
        icon: statistic.icon ?? '',
        is_active: statistic.is_active,
      }
    : { ...EMPTY };

export function StatisticFormDialog({
  statistic,
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: Props) {
  const { t } = useLocale();
  const [form, setForm] = useState<StatisticInput>(() => toForm(statistic));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(statistic));
      setError(null);
    }
  }, [open, statistic]);

  const set = <K extends keyof StatisticInput>(
    key: K,
    value: StatisticInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!form.number.trim() || !form.label_ar.trim() || !form.label_en.trim()) {
      setError(t('admin.content.required'));
      return;
    }
    setError(null);
    onSubmit({
      number: form.number.trim(),
      label_ar: form.label_ar.trim(),
      label_en: form.label_en.trim(),
      icon: form.icon && (form.icon as string).trim() ? (form.icon as string).trim() : null,
      is_active: form.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-statistic-form">
        <DialogHeader>
          <DialogTitle>
            {statistic
              ? t('admin.content.statistics.editTitle')
              : t('admin.content.statistics.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.content.statistics.formDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="statistic-number">
              {t('admin.content.statistics.number')}
            </Label>
            <Input
              id="statistic-number"
              dir="ltr"
              placeholder="10+"
              value={form.number}
              onChange={(event) => set('number', event.target.value)}
              data-testid="input-statistic-number"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="statistic-label-ar">
                {t('admin.content.statistics.labelAr')}
              </Label>
              <Input
                id="statistic-label-ar"
                dir="rtl"
                value={form.label_ar}
                onChange={(event) => set('label_ar', event.target.value)}
                data-testid="input-statistic-label-ar"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statistic-label-en">
                {t('admin.content.statistics.labelEn')}
              </Label>
              <Input
                id="statistic-label-en"
                dir="ltr"
                value={form.label_en}
                onChange={(event) => set('label_en', event.target.value)}
                data-testid="input-statistic-label-en"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statistic-icon">
              {t('admin.content.statistics.icon')}
            </Label>
            <Input
              id="statistic-icon"
              dir="ltr"
              placeholder="Users"
              value={form.icon ?? ''}
              onChange={(event) => set('icon', event.target.value)}
              data-testid="input-statistic-icon"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.content.statistics.iconHint')}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="font-medium">{t('admin.content.isActive')}</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(is_active) => set('is_active', is_active)}
              data-testid="switch-statistic-active"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" data-testid="error-statistic-form">
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
            data-testid="button-cancel-statistic"
          >
            {t('admin.content.cancel')}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isSaving}
            data-testid="button-submit-statistic"
          >
            {isSaving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
            {t('admin.content.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
