import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/icon-input';
import { Mail, Phone, User } from 'lucide-react';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, FieldError, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';

interface RegisterErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+0-9٠-٩\s()-]{8,}$/;

export default function RegisterPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t('auth.validation.fullNameRequired');
    if (!form.email.trim()) nextErrors.email = t('auth.validation.emailRequired');
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = t('auth.validation.emailInvalid');
    if (!form.phone.trim()) nextErrors.phone = t('auth.validation.phoneRequired');
    else if (!phonePattern.test(form.phone.trim())) nextErrors.phone = t('auth.validation.phoneInvalid');
    if (!form.password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) nextErrors.password = t('auth.validation.passwordWeak');
    if (!form.confirmPassword) nextErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = t('auth.validation.passwordMismatch');
    if (!terms) nextErrors.terms = t('auth.validation.termsRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate()) setFeedback(form.email.toLowerCase().includes('error') ? 'error' : 'success');
  };

  return (
    <AuthLayout
      eyebrow={t('auth.register.eyebrow')}
      title={t('auth.register.title')}
      description={t('auth.register.description')}
      footer={<AuthFooterLink prompt={t('auth.register.haveAccount')} label={t('auth.register.signIn')} href="/login" testId="link-login" />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label={t('auth.register.formLabel')}>
        <div className="space-y-2">
          <label htmlFor="register-full-name" className="block text-sm font-semibold text-foreground">{t('auth.fullName')}</label>
          <IconInput icon={User} id="register-full-name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" placeholder={t('auth.fullNamePlaceholder')} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'register-full-name-error' : undefined} data-testid="input-register-full-name" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
          <FieldError id="register-full-name-error" message={errors.fullName} testId="error-register-full-name" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="register-email" className="block text-sm font-semibold text-foreground">{t('auth.email')}</label>
            <IconInput icon={Mail} id="register-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" placeholder={t('auth.emailPlaceholder')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} data-testid="input-register-email" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
            <FieldError id="register-email-error" message={errors.email} testId="error-register-email" />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-phone" className="block text-sm font-semibold text-foreground">{t('auth.phone')}</label>
            <IconInput icon={Phone} id="register-phone" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" placeholder={t('auth.phonePlaceholder')} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'register-phone-error' : undefined} data-testid="input-register-phone" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
            <FieldError id="register-phone-error" message={errors.phone} testId="error-register-phone" />
          </div>
        </div>
        <PasswordField id="register-password" label={t('auth.password')} value={form.password} onChange={(value) => update('password', value)} error={errors.password} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} testId="field-register-password" inputTestId="input-register-password" />
        <PasswordField id="register-confirm-password" label={t('auth.confirmPassword')} value={form.confirmPassword} onChange={(value) => update('confirmPassword', value)} error={errors.confirmPassword} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-register-confirm-password" inputTestId="input-register-confirm-password" />
        <div className="space-y-2 pt-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted-foreground" htmlFor="register-terms">
            <Checkbox id="register-terms" checked={terms} onCheckedChange={(checked) => setTerms(checked === true)} aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? 'register-terms-error' : undefined} data-testid="checkbox-accept-terms" className="mt-1" />
            <span>{t('auth.register.acceptTerms')} <a href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline" data-testid="link-terms">{t('auth.register.terms')}</a></span>
          </label>
          <FieldError id="register-terms-error" message={errors.terms} testId="error-register-terms" />
        </div>
        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-register-submit">{t('auth.register.submit')}</Button>
      </form>
      <AuthFeedbackDialog open={feedback !== null} kind={feedback ?? 'success'} title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.register.successTitle')} description={feedback === 'error' ? t('auth.feedback.errorDescription') : t('auth.register.successDescription')} actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.feedback.signIn')} onOpenChange={(open) => !open && setFeedback(null)} onAction={() => { const current = feedback; setFeedback(null); if (current === 'success') setLocation('/login'); }} />
    </AuthLayout>
  );
}