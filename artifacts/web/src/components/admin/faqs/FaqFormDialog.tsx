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
  FAQ_ANSWER_MAX,
  FAQ_CATEGORIES,
  FAQ_QUESTION_MAX,
  FAQ_STATUSES,
  type Faq,
  type FaqCategory,
  type FaqInput,
  type FaqStatus,
} from '@/services/adminFaqs';

export type FaqFormErrors = Record<string, string>;

interface FaqFormDialogProps {
  faq: Faq | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  serverErrors: FaqFormErrors;
  onSubmit: (input: FaqInput) => void;
}

interface FormState {
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  category: string;
  display_order: string;
  status: FaqStatus;
}

const NO_CATEGORY = 'none';

const emptyState = (): FormState => ({
  question_ar: '',
  question_en: '',
  answer_ar: '',
  answer_en: '',
  category: NO_CATEGORY,
  display_order: '1',
  status: 'draft',
});

/**
 * Reusable create/edit FAQ form with AR/EN tabs.
 * On create, "Save as Draft" and "Publish" set the status directly;
 * on edit, the status select controls it and a single Save button submits.
 */
export function FaqFormDialog({
  faq,
  open,
  onOpenChange,
  isSaving,
  serverErrors,
  onSubmit,
}: FaqFormDialogProps) {
  const { t, dir } = useLocale();
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<FaqFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (faq) {
      setForm({
        question_ar: faq.question_ar,
        question_en: faq.question_en,
        answer_ar: faq.answer_ar,
        answer_en: faq.answer_en,
        category: faq.category ?? NO_CATEGORY,
        display_order: String(faq.display_order),
        status: faq.status,
      });
    } else {
      setForm(emptyState());
    }
  }, [open, faq]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fieldError = (key: string) => errors[key] ?? serverErrors[key];

  const validate = (): boolean => {
    const next: FaqFormErrors = {};
    (['ar', 'en'] as const).forEach((lang) => {
      const question = form[`question_${lang}`];
      if (!question.trim()) next[`question_${lang}`] = t('admin.faqs.required');
      else if (question.length > FAQ_QUESTION_MAX)
        next[`question_${lang}`] = t('admin.faqs.tooLong', {
          max: String(FAQ_QUESTION_MAX),
        });
      const answer = form[`answer_${lang}`];
      if (!answer.trim()) next[`answer_${lang}`] = t('admin.faqs.required');
      else if (answer.length > FAQ_ANSWER_MAX)
        next[`answer_${lang}`] = t('admin.faqs.tooLong', {
          max: String(FAQ_ANSWER_MAX),
        });
    });
    const order = Number(form.display_order);
    if (!Number.isInteger(order) || order < 1)
      next.display_order = t('admin.faqs.invalidOrder');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (status: FaqStatus) => {
    if (!validate()) return;
    onSubmit({
      question_ar: form.question_ar.trim(),
      question_en: form.question_en.trim(),
      answer_ar: form.answer_ar.trim(),
      answer_en: form.answer_en.trim(),
      category:
        form.category === NO_CATEGORY ? null : (form.category as FaqCategory),
      display_order: Number(form.display_order),
      status,
    });
  };

  const bilingualFields = (lang: 'ar' | 'en') => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`faq-question-${lang}`}>
          {t(`admin.faqs.fields.question_${lang}`)} *
        </Label>
        <Textarea
          id={`faq-question-${lang}`}
          value={form[`question_${lang}`]}
          onChange={(event) => set(`question_${lang}`, event.target.value)}
          rows={2}
          maxLength={FAQ_QUESTION_MAX + 1}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          data-testid={`input-faq-question-${lang}`}
        />
        <div className="flex items-center justify-between">
          {fieldError(`question_${lang}`) ? (
            <p
              className="text-sm text-destructive"
              data-testid={`error-faq-question-${lang}`}
            >
              {fieldError(`question_${lang}`)}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground" dir="ltr">
            {form[`question_${lang}`].length}/{FAQ_QUESTION_MAX}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`faq-answer-${lang}`}>
          {t(`admin.faqs.fields.answer_${lang}`)} *
        </Label>
        <Textarea
          id={`faq-answer-${lang}`}
          value={form[`answer_${lang}`]}
          onChange={(event) => set(`answer_${lang}`, event.target.value)}
          rows={5}
          maxLength={FAQ_ANSWER_MAX + 1}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          data-testid={`input-faq-answer-${lang}`}
        />
        <div className="flex items-center justify-between">
          {fieldError(`answer_${lang}`) ? (
            <p
              className="text-sm text-destructive"
              data-testid={`error-faq-answer-${lang}`}
            >
              {fieldError(`answer_${lang}`)}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground" dir="ltr">
            {form[`answer_${lang}`].length}/{FAQ_ANSWER_MAX}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        data-testid="dialog-faq-form"
      >
        <DialogHeader>
          <DialogTitle>
            {faq ? t('admin.faqs.editFaq') : t('admin.faqs.addFaq')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue={dir === 'rtl' ? 'ar' : 'en'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ar" data-testid="tab-faq-ar">
                {t('admin.faqs.arabicTab')}
              </TabsTrigger>
              <TabsTrigger value="en" data-testid="tab-faq-en">
                {t('admin.faqs.englishTab')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ar" className="pt-3">
              {bilingualFields('ar')}
            </TabsContent>
            <TabsContent value="en" className="pt-3">
              {bilingualFields('en')}
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('admin.faqs.fields.category')}</Label>
              <Select
                value={form.category}
                onValueChange={(category) => set('category', category)}
              >
                <SelectTrigger data-testid="select-faq-form-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>
                    {t('admin.faqs.noCategory')}
                  </SelectItem>
                  {FAQ_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`admin.faqs.categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-order">
                {t('admin.faqs.fields.display_order')} *
              </Label>
              <Input
                id="faq-order"
                type="number"
                min={1}
                step={1}
                value={form.display_order}
                onChange={(event) => set('display_order', event.target.value)}
                dir="ltr"
                data-testid="input-faq-order"
              />
              {fieldError('display_order') ? (
                <p
                  className="text-sm text-destructive"
                  data-testid="error-faq-order"
                >
                  {fieldError('display_order')}
                </p>
              ) : null}
            </div>
          </div>

          {faq ? (
            <div className="space-y-2">
              <Label>{t('admin.faqs.fields.status')} *</Label>
              <Select
                value={form.status}
                onValueChange={(status) => set('status', status as FaqStatus)}
              >
                <SelectTrigger data-testid="select-faq-form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`admin.faqs.statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-faq-cancel"
          >
            {t('admin.faqs.cancel')}
          </Button>
          {faq ? (
            <Button
              onClick={() => handleSubmit(form.status)}
              disabled={isSaving}
              data-testid="button-faq-save"
            >
              {isSaving ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('admin.faqs.save')}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => handleSubmit('draft')}
                disabled={isSaving}
                data-testid="button-faq-save-draft"
              >
                {isSaving ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('admin.faqs.saveDraft')}
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={isSaving}
                data-testid="button-faq-publish"
              >
                {isSaving ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('admin.faqs.publish')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
