import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import {
  PARTNER_DESCRIPTION_MAX,
  PARTNER_NAME_MAX,
  PARTNER_TYPES,
  type Partner,
  type PartnerInput,
  type PartnerStatus,
  type PartnerType,
} from '@/services/adminPartners';
import { PartnerLogoInput } from '@/components/admin/partners/PartnerLogoInput';

export type PartnerFormErrors = Record<string, string>;

interface PartnerFormDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  serverErrors: PartnerFormErrors;
  onSubmit: (input: PartnerInput) => void;
}

interface FormState {
  name_ar: string;
  name_en: string;
  type: PartnerType;
  website_url: string;
  description_ar: string;
  description_en: string;
  display_order: string;
  status: PartnerStatus;
  logo: File | null;
  logoRemoved: boolean;
}

const emptyState = (): FormState => ({
  name_ar: '',
  name_en: '',
  type: 'strategic',
  website_url: '',
  description_ar: '',
  description_en: '',
  display_order: '1',
  status: 'active',
  logo: null,
  logoRemoved: false,
});

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Reusable create/edit partner form with AR/EN tabs. */
export function PartnerFormDialog({
  partner,
  open,
  onOpenChange,
  isSaving,
  serverErrors,
  onSubmit,
}: PartnerFormDialogProps) {
  const { t, dir } = useLocale();
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<PartnerFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (partner) {
      setForm({
        name_ar: partner.name_ar,
        name_en: partner.name_en,
        type: partner.type,
        website_url: partner.website_url ?? '',
        description_ar: partner.description_ar,
        description_en: partner.description_en,
        display_order: String(partner.display_order),
        status: partner.status,
        logo: null,
        logoRemoved: false,
      });
    } else {
      setForm(emptyState());
    }
  }, [open, partner]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldError = (key: string) => errors[key] ?? serverErrors[key];

  const validate = (): boolean => {
    const next: PartnerFormErrors = {};
    if (!form.name_ar.trim()) next.name_ar = t('admin.partners.required');
    else if (form.name_ar.length > PARTNER_NAME_MAX)
      next.name_ar = t('admin.partners.tooLong', {
        max: String(PARTNER_NAME_MAX),
      });
    if (!form.name_en.trim()) next.name_en = t('admin.partners.required');
    else if (form.name_en.length > PARTNER_NAME_MAX)
      next.name_en = t('admin.partners.tooLong', {
        max: String(PARTNER_NAME_MAX),
      });
    if (form.description_ar.length > PARTNER_DESCRIPTION_MAX)
      next.description_ar = t('admin.partners.tooLong', {
        max: String(PARTNER_DESCRIPTION_MAX),
      });
    if (form.description_en.length > PARTNER_DESCRIPTION_MAX)
      next.description_en = t('admin.partners.tooLong', {
        max: String(PARTNER_DESCRIPTION_MAX),
      });
    const hasLogo =
      form.logo !== null || (partner?.logo_url != null && !form.logoRemoved);
    if (!hasLogo) next.logo = t('admin.partners.logoRequired');
    const website = form.website_url.trim();
    if (website && !isValidUrl(website))
      next.website_url = t('admin.partners.invalidUrl');
    const order = Number(form.display_order);
    if (!Number.isInteger(order) || order < 1)
      next.display_order = t('admin.partners.invalidOrder');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      logo: form.logo,
      type: form.type,
      website_url: form.website_url.trim() || null,
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim(),
      display_order: Number(form.display_order),
      status: form.status,
    });
  };

  const bilingualFields = (lang: 'ar' | 'en') => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`partner-name-${lang}`}>
          {t(`admin.partners.fields.name_${lang}`)} *
        </Label>
        <Input
          id={`partner-name-${lang}`}
          value={form[`name_${lang}`]}
          onChange={(event) => set(`name_${lang}`, event.target.value)}
          maxLength={PARTNER_NAME_MAX + 1}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          data-testid={`input-partner-name-${lang}`}
        />
        <div className="flex items-center justify-between">
          {fieldError(`name_${lang}`) ? (
            <p
              className="text-sm text-destructive"
              data-testid={`error-partner-name-${lang}`}
            >
              {fieldError(`name_${lang}`)}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground" dir="ltr">
            {form[`name_${lang}`].length}/{PARTNER_NAME_MAX}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`partner-description-${lang}`}>
          {t(`admin.partners.fields.description_${lang}`)}
        </Label>
        <Textarea
          id={`partner-description-${lang}`}
          value={form[`description_${lang}`]}
          onChange={(event) => set(`description_${lang}`, event.target.value)}
          rows={3}
          maxLength={PARTNER_DESCRIPTION_MAX + 1}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          data-testid={`input-partner-description-${lang}`}
        />
        <div className="flex items-center justify-between">
          {fieldError(`description_${lang}`) ? (
            <p className="text-sm text-destructive">
              {fieldError(`description_${lang}`)}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground" dir="ltr">
            {form[`description_${lang}`].length}/{PARTNER_DESCRIPTION_MAX}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        data-testid="dialog-partner-form"
      >
        <DialogHeader>
          <DialogTitle>
            {partner
              ? t('admin.partners.editPartner')
              : t('admin.partners.addPartner')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue={dir === 'rtl' ? 'ar' : 'en'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ar" data-testid="tab-partner-ar">
                {t('admin.partners.arabicTab')}
              </TabsTrigger>
              <TabsTrigger value="en" data-testid="tab-partner-en">
                {t('admin.partners.englishTab')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ar" className="pt-3">
              {bilingualFields('ar')}
            </TabsContent>
            <TabsContent value="en" className="pt-3">
              {bilingualFields('en')}
            </TabsContent>
          </Tabs>

          {/*
            Logos are mandatory, so "remove" is never persisted on its own:
            it only clears the current selection and blocks saving until a
            replacement is chosen (hence no `remove_logo` API flag).
          */}
          <PartnerLogoInput
            existingUrl={form.logoRemoved ? null : (partner?.logo_url ?? null)}
            file={form.logo}
            onChange={(file) =>
              setForm((prev) => ({
                ...prev,
                logo: file,
                logoRemoved: file === null,
              }))
            }
            error={
              form.logoRemoved && !form.logo
                ? t('admin.partners.logoRequired')
                : fieldError('logo')
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('admin.partners.fields.type')} *</Label>
              <Select
                value={form.type}
                onValueChange={(type) => set('type', type as PartnerType)}
              >
                <SelectTrigger data-testid="select-partner-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`admin.partners.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.partners.fields.status')} *</Label>
              <Select
                value={form.status}
                onValueChange={(status) =>
                  set('status', status as PartnerStatus)
                }
              >
                <SelectTrigger data-testid="select-partner-form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {t('admin.partners.statuses.active')}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t('admin.partners.statuses.inactive')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partner-website">
                {t('admin.partners.fields.website')}
              </Label>
              <Input
                id="partner-website"
                value={form.website_url}
                onChange={(event) => set('website_url', event.target.value)}
                placeholder="https://example.org"
                dir="ltr"
                data-testid="input-partner-website"
              />
              {fieldError('website_url') ? (
                <p
                  className="text-sm text-destructive"
                  data-testid="error-partner-website"
                >
                  {fieldError('website_url')}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-order">
                {t('admin.partners.fields.display_order')} *
              </Label>
              <Input
                id="partner-order"
                type="number"
                min={1}
                step={1}
                value={form.display_order}
                onChange={(event) => set('display_order', event.target.value)}
                dir="ltr"
                data-testid="input-partner-order"
              />
              {fieldError('display_order') ? (
                <p
                  className="text-sm text-destructive"
                  data-testid="error-partner-order"
                >
                  {fieldError('display_order')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-partner-cancel"
          >
            {t('admin.partners.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            data-testid="button-partner-save"
          >
            {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('admin.partners.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
