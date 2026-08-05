import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Digits, spaces, dashes, parentheses, optional leading +; 7-20 chars. */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

interface FormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  const { t } = useLocale();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: keyof FormValues, value: string): string | undefined => {
    const trimmed = value.trim();
    switch (field) {
      case 'name':
        return trimmed ? undefined : t('contact.form.nameRequired');
      case 'email':
        if (!trimmed) return t('contact.form.emailRequired');
        return EMAIL_PATTERN.test(trimmed) ? undefined : t('contact.form.emailInvalid');
      case 'phone':
        if (!trimmed) return t('contact.form.phoneRequired');
        return PHONE_PATTERN.test(trimmed) ? undefined : t('contact.form.phoneInvalid');
      case 'subject':
        return trimmed ? undefined : t('contact.form.subjectRequired');
      default:
        return undefined; // message is optional
    }
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Re-validate immediately only if the field already shows an error,
    // so the message disappears as soon as the input becomes valid.
    setErrors((prev) =>
      prev[field] !== undefined ? { ...prev, [field]: validateField(field, value) } : prev,
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    (['name', 'email', 'phone', 'subject'] as const).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const trimmedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    ) as FormValues;
    setValues(trimmedValues);
    setIsSubmitting(true);
    setSuccessOpen(true);
  };

  const fieldError = (field: keyof FormValues) =>
    errors[field] ? (
      <p className="text-sm text-destructive" role="alert" data-testid={`error-${field}`}>
        {errors[field]}
      </p>
    ) : null;

  const invalidClass = (field: keyof FormValues) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('contact.title')} 
        description={t('contact.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('contact.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.fullName')}</Label>
                  <Input
                    id="name"
                    value={values.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'error-name' : undefined}
                    className={cn('rounded-xl bg-background', invalidClass('name'))}
                    data-testid="input-contact-name"
                  />
                  {fieldError('name')}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      value={values.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'error-email' : undefined}
                      className={cn('text-start rounded-xl bg-background', invalidClass('email'))}
                      data-testid="input-contact-email"
                    />
                    {fieldError('email')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('common.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      dir="ltr"
                      value={values.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'error-phone' : undefined}
                      className={cn('text-start rounded-xl bg-background', invalidClass('phone'))}
                      data-testid="input-contact-phone"
                    />
                    {fieldError('phone')}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('common.subject')}</Label>
                    <Input
                      id="subject"
                      value={values.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? 'error-subject' : undefined}
                      className={cn('rounded-xl bg-background', invalidClass('subject'))}
                      data-testid="input-contact-subject"
                    />
                    {fieldError('subject')}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="message">
                      {t('common.message')}{' '}
                      <span className="text-muted-foreground font-normal">{t('contact.form.optional')}</span>
                    </Label>
                    <Textarea
                      id="message"
                      rows={2}
                      value={values.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="rounded-xl bg-background resize-none"
                      data-testid="input-contact-message"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-lg font-bold"
                  data-testid="button-contact-submit"
                >
                  {isSubmitting ? t('common.loading') : t('common.send')}
                </Button>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />

      {/* Success dialog */}
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) {
            setIsSubmitting(false);
            setValues(EMPTY_VALUES);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-contact-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('contact.form.successTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('contact.form.successMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                setSuccessOpen(false);
                setIsSubmitting(false);
                setValues(EMPTY_VALUES);
              }}
              data-testid="button-contact-success-ok"
            >
              {t('contact.form.okBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
