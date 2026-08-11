import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapPin, Phone, Mail, Zap, MessagesSquare, Clock, Facebook, Instagram, User, Tag } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { IconInput } from '@/components/ui/icon-input';
import { CountryPhoneField } from '@/components/forms/CountryPhoneField';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
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
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { useMutation } from '@tanstack/react-query';
import { publicContactApi } from '@/services/publicContact';
import { getApiError } from '@/services/api';
import { usePublicSettings, toWhatsAppNumber, safeExternalUrl } from '@/hooks/usePublicSettings';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  const { t, locale } = useLocale();
  const settings = usePublicSettings();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  // Honeypot: humans never see or fill this; bots autofilling every input do.
  const [honeypot, setHoneypot] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('JO');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const submitMutation = useMutation({
    mutationFn: publicContactApi.send,
    onSuccess: () => {
      setSuccessOpen(true);
      setValues(EMPTY_VALUES);
      setErrors({});
      setFormError(null);
    },
    onError: (error: unknown) => {
      const { fields, status } = getApiError(error);
      const fieldErrors: FormErrors = {};
      (['name', 'email', 'phone', 'subject', 'message'] as const).forEach((field) => {
        if (fields?.[field]?.length) fieldErrors[field] = fields[field][0];
      });
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) {
        setFormError(null);
      } else if (status === 429) {
        setFormError(t('contact.form.tooMany'));
      } else if (status === undefined) {
        setFormError(t('news.networkError'));
      } else {
        setFormError(t('contact.form.sendError'));
      }
    },
  });
  const isSubmitting = submitMutation.isPending;

  const validateField = (field: keyof FormValues, value: string): string | undefined => {
    const trimmed = value.trim();
    switch (field) {
      case 'name':
        return trimmed ? undefined : t('contact.form.nameRequired');
      case 'email':
        if (!trimmed) return t('contact.form.emailRequired');
        return EMAIL_PATTERN.test(trimmed) ? undefined : t('contact.form.emailInvalid');
      case 'phone':
        if (!trimmed || trimmed === '+962') return t('contact.form.phoneRequired');
        return isValidPhoneNumber(trimmed, phoneCountry) ? undefined : t('contact.form.phoneInvalid');
      case 'subject':
        return trimmed ? undefined : t('contact.form.subjectRequired');
      case 'message':
        return trimmed ? undefined : t('contact.form.messageRequired');
      default:
        return undefined;
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
    if (isSubmitting) return; // prevent duplicate submissions
    const nextErrors: FormErrors = {};
    (['name', 'email', 'phone', 'subject', 'message'] as const).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const trimmedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    ) as FormValues;
    setValues(trimmedValues);
    setFormError(null);
    submitMutation.mutate({ ...trimmedValues, website: honeypot });
  };

  const fieldError = (field: keyof FormValues) =>
    errors[field] ? (
      <p className="text-sm text-destructive" role="alert" data-testid={`error-${field}`}>
        {errors[field]}
      </p>
    ) : null;

  const invalidClass = (field: keyof FormValues) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : undefined;

  /** Shared premium input styling: taller, 13px radius, primary focus ring. */
  const inputClass =
    'h-12 rounded-[13px] bg-background border-border/80 transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('contact.title')} 
        description={t('contact.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('contact.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper className="relative overflow-hidden">
          {/* Subtle section backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 15% 0%, hsl(197 100% 31% / 0.05), transparent 65%), radial-gradient(ellipse 50% 45% at 90% 100%, hsl(20 100% 52% / 0.04), transparent 60%)',
            }}
            aria-hidden="true"
          ></div>

          <div className="relative grid gap-10 lg:gap-14 lg:grid-cols-2 lg:items-stretch">
            {/* Contact info card */}
            <div className="animate-hero-up flex">
              <div className="group/card relative flex w-full flex-col overflow-hidden bg-card rounded-[20px] border border-primary/15 p-7 md:p-9 shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_18px_45px_rgba(0,0,0,0.11)]">
                {/* Decorative accents */}
                <span className="absolute top-0 start-0 h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-secondary" aria-hidden="true"></span>
                <div
                  className="absolute -top-20 -end-20 w-56 h-56 rounded-full pointer-events-none opacity-60"
                  style={{ background: 'radial-gradient(circle, hsl(197 100% 31% / 0.08) 0%, transparent 65%)' }}
                  aria-hidden="true"
                ></div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true"></span>
                  {t('nav.contact')}
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {t('contact.title')}
                </h2>
                <p className="text-muted-foreground mb-8">{t('common.contactDesc')}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 group rounded-2xl p-3 -m-1 transition-colors duration-300 hover:bg-primary/5">
                    <div className="p-3.5 bg-primary/10 text-primary rounded-xl shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground motion-safe:group-hover:scale-105">
                      <MapPin className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm uppercase tracking-wide mb-0.5">{t('footer.address')}</h3>
                      <p className="text-muted-foreground">
                        {(locale === 'ar' ? settings?.contact.address_ar : settings?.contact.address_en) || t('contact.addressValue')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group rounded-2xl p-3 -m-1 transition-colors duration-300 hover:bg-secondary/5">
                    <div className="p-3.5 bg-secondary/10 text-secondary rounded-xl shrink-0 transition-all duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground motion-safe:group-hover:scale-105">
                      <Phone className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm uppercase tracking-wide mb-0.5">{t('footer.phone')}</h3>
                      <p className="text-muted-foreground ltr-safe block" dir="ltr">{settings?.contact.phone || '+962 6 123 4567'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group rounded-2xl p-3 -m-1 transition-colors duration-300 hover:bg-info/5">
                    <div className="p-3.5 bg-info/10 text-info rounded-xl shrink-0 transition-all duration-300 group-hover:bg-info group-hover:text-info-foreground motion-safe:group-hover:scale-105">
                      <Mail className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm uppercase tracking-wide mb-0.5">{t('footer.email')}</h3>
                      <p className="text-muted-foreground ltr-safe block" dir="ltr">{settings?.contact.email || 'info@mujaddidun.org'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick highlights */}
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {[
                    { icon: Zap, label: t('common.contactHighlightFast') },
                    { icon: MessagesSquare, label: t('common.contactHighlightConsult') },
                    { icon: Clock, label: t('common.contactHighlight247') },
                  ].map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-medium text-foreground/80"
                    >
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {label}
                    </span>
                  ))}
                </div>

                {/* Follow us */}
                <div className="mt-auto pt-8">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/40 px-5 py-4">
                    <span className="font-bold text-foreground">{t('footer.followUs')}</span>
                    <div className="flex items-center gap-2.5">
                      {[
                        { icon: Facebook, label: 'Facebook', link: settings?.social.facebook },
                        { icon: Instagram, label: 'Instagram', link: settings?.social.instagram },
                        { icon: FaWhatsapp, label: 'WhatsApp', link: settings?.social.whatsapp },
                      ]
                        .map(({ icon, label, link }) => {
                          // Before settings load, keep the static placeholders.
                          if (!settings) return { icon, label, href: '#', external: false };
                          if (!link?.enabled || !link.value) return null;
                          const number = label === 'WhatsApp' ? toWhatsAppNumber(link.value) : null;
                          const href = number ? `https://wa.me/${number}` : safeExternalUrl(link.value);
                          return href ? { icon, label, href, external: true } : null;
                        })
                        .filter((entry): entry is { icon: typeof Facebook; label: string; href: string; external: boolean } => entry !== null)
                        .map(({ icon: Icon, label, href, external }) => (
                        <a
                          key={label}
                          href={href}
                          target={external ? '_blank' : undefined}
                          rel={external ? 'noopener noreferrer' : undefined}
                          aria-label={label}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/70 text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary motion-safe:hover:scale-105"
                          data-testid={`link-contact-social-${label.toLowerCase()}`}
                        >
                          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="animate-hero-up relative overflow-hidden bg-card border border-primary/15 rounded-[20px] p-7 md:p-9 shadow-[0_12px_35px_rgba(0,0,0,0.08)]" style={{ animationDelay: '120ms' }}>
              <div
                className="absolute -bottom-24 -start-24 w-64 h-64 rounded-full pointer-events-none opacity-50"
                style={{ background: 'radial-gradient(circle, hsl(20 100% 52% / 0.07) 0%, transparent 65%)' }}
                aria-hidden="true"
              ></div>
              <form onSubmit={handleSubmit} noValidate className="relative space-y-6">
                {/* Honeypot field — visually hidden, ignored by humans. */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.fullName')}</Label>
                  <IconInput
                    icon={User}
                    id="name"
                    value={values.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'error-name' : undefined}
                    className={cn(inputClass, invalidClass('name'))}
                    data-testid="input-contact-name"
                  />
                  {fieldError('name')}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <IconInput
                      icon={Mail}
                      id="email"
                      type="email"
                      dir="ltr"
                      value={values.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'error-email' : undefined}
                      className={cn('text-start', inputClass, invalidClass('email'))}
                      data-testid="input-contact-email"
                    />
                    {fieldError('email')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('common.phone')}</Label>
                    <CountryPhoneField
                      id="phone"
                      value={values.phone}
                      onChange={(value) => handleChange('phone', value)}
                      onCountryChange={(country) => setPhoneCountry(country.code)}
                      ariaInvalid={!!errors.phone}
                      ariaDescribedBy={errors.phone ? 'error-phone' : undefined}
                      inputTestId="input-contact-phone"
                    />
                    {fieldError('phone')}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t('common.subject')}</Label>
                  <IconInput
                    icon={Tag}
                    id="subject"
                    value={values.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'error-subject' : undefined}
                    className={cn(inputClass, invalidClass('subject'))}
                    data-testid="input-contact-subject"
                  />
                  {fieldError('subject')}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('common.message')}</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={values.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'error-message' : undefined}
                    className={cn(
                      'rounded-[13px] bg-background resize-none border-border/80 transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
                      invalidClass('message'),
                    )}
                    data-testid="input-contact-message"
                  />
                  {fieldError('message')}
                </div>

                {formError && (
                  <p className="text-sm text-destructive" role="alert" data-testid="error-contact-form">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-[14px] text-lg font-bold text-white bg-gradient-to-br from-primary via-primary to-[#005a80] shadow-[0_8px_24px_rgba(0,113,160,0.3)] transition-all duration-300 motion-safe:hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(0,113,160,0.4)]"
                  data-testid="button-contact-submit"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                        aria-hidden="true"
                      ></span>
                      {t('common.loading')}
                    </span>
                  ) : (
                    t('common.send')
                  )}
                </Button>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </main>
      <Footer />

      {/* Success dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
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
              onClick={() => setSuccessOpen(false)}
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
