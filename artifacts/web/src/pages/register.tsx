import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { IconInput } from '@/components/ui/icon-input';
import { CheckCircle2, Mail, User, XCircle } from 'lucide-react';
import { AuthDivider, AuthFeedbackDialog, AuthFooterLink, AuthLayout, AuthSubmitButton, FieldError, GoogleAuthButton, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { CountryPhoneField, type PhoneCountry } from '@/components/forms/CountryPhoneField';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { authApi } from '@/services/auth';
import { getApiError } from '@/services/api';

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RULES = [
  { key: 'length', test: (value: string) => value.length >= 8 },
  { key: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lowercase', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', test: (value: string) => /\d/.test(value) },
  { key: 'special', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export default function RegisterPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '+962', password: '', confirmPassword: '' });
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('JO');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [googleAuthRequested, setGoogleAuthRequested] = useState(false);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const passwordRules = PASSWORD_RULES.map((rule) => ({ ...rule, valid: rule.test(form.password) }));
  const confirmPasswordError = form.confirmPassword && form.password !== form.confirmPassword
    ? t('auth.validation.passwordMismatch')
    : errors.confirmPassword;

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('auth.validation.firstNameRequired');
    if (!form.lastName.trim()) nextErrors.lastName = t('auth.validation.lastNameRequired');
    if (!form.email.trim()) nextErrors.email = t('auth.validation.emailRequired');
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = t('auth.validation.emailInvalid');
    if (!form.phone.trim() || form.phone === '+962') nextErrors.phone = t('auth.validation.phoneRequired');
    else if (!isValidPhoneNumber(form.phone, phoneCountry)) nextErrors.phone = t('auth.validation.phoneInvalidCountry');
    if (!form.password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (passwordRules.some((rule) => !rule.valid)) nextErrors.password = t('auth.validation.passwordWeak');
    if (!form.confirmPassword) nextErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = t('auth.validation.passwordMismatch');
    if (!terms) nextErrors.terms = t('auth.validation.termsRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedbackMessage('');
    try {
      await authApi.register({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country_code: phoneCountry,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });
      setFeedback('success');
    } catch (error) {
      const apiError = getApiError(error);
      const fieldMap: RegisterErrors = {};
      Object.entries(apiError.fields).forEach(([field, message]) => {
        const keyMap: Record<string, keyof RegisterErrors> = {
          first_name: 'firstName',
          last_name: 'lastName',
          password_confirmation: 'confirmPassword',
        };
        fieldMap[keyMap[field] ?? field as keyof RegisterErrors] = message;
      });
      setErrors((current) => ({ ...current, ...fieldMap }));
      setFeedbackMessage(apiError.message);
      setFeedback('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={t('auth.register.eyebrow')}
      title={t('auth.register.title')}
      description={t('auth.register.description')}
      footer={<AuthFooterLink prompt={t('auth.register.haveAccount')} label={t('auth.register.signIn')} href="/login" testId="link-login" />}
    >
      <div className="mb-5 space-y-3">
        <GoogleAuthButton
          label={t('auth.socialLogin.registerWithGoogle')}
          onClick={() => setGoogleAuthRequested(true)}
          testId="button-register-google"
        />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label={t('auth.register.formLabel')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="register-first-name" className="block text-sm font-semibold text-foreground">{t('auth.firstName')}</label>
            <IconInput icon={User} id="register-first-name" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} autoComplete="given-name" placeholder={t('auth.firstNamePlaceholder')} aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'register-first-name-error' : undefined} data-testid="input-register-first-name" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
            <FieldError id="register-first-name-error" message={errors.firstName} testId="error-register-first-name" />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-last-name" className="block text-sm font-semibold text-foreground">{t('auth.lastName')}</label>
            <IconInput icon={User} id="register-last-name" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} autoComplete="family-name" placeholder={t('auth.lastNamePlaceholder')} aria-invalid={Boolean(errors.lastName)} aria-describedby={errors.lastName ? 'register-last-name-error' : undefined} data-testid="input-register-last-name" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
            <FieldError id="register-last-name-error" message={errors.lastName} testId="error-register-last-name" />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="register-email" className="block text-sm font-semibold text-foreground">{t('auth.email')}</label>
          <IconInput icon={Mail} id="register-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" placeholder={t('auth.emailPlaceholder')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} data-testid="input-register-email" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
          <FieldError id="register-email-error" message={errors.email} testId="error-register-email" />
        </div>
        <div className="space-y-2">
          <label htmlFor="register-phone" className="block text-sm font-semibold text-foreground">{t('auth.phone')}</label>
          <CountryPhoneField
            value={form.phone}
            onChange={(value) => update('phone', value)}
            onCountryChange={(country: PhoneCountry) => setPhoneCountry(country.code)}
            id="register-phone"
            placeholder={t('auth.phonePlaceholder')}
            ariaInvalid={Boolean(errors.phone)}
            ariaDescribedBy={errors.phone ? 'register-phone-error' : undefined}
            inputTestId="input-register-phone"
            selectorTestId="button-register-country"
          />
          <p className="text-xs text-muted-foreground">{t('auth.phoneFormatHint')}</p>
          <FieldError id="register-phone-error" message={errors.phone} testId="error-register-phone" />
        </div>
        <div className="space-y-2">
          <PasswordField id="register-password" label={t('auth.password')} value={form.password} onChange={(value) => update('password', value)} error={errors.password} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} testId="field-register-password" inputTestId="input-register-password" />
          <div className="grid gap-x-4 gap-y-1 rounded-xl border border-border/70 bg-muted/30 p-3 sm:grid-cols-2" aria-live="polite" data-testid="register-password-checklist">
            {passwordRules.map((rule) => (
              <div key={rule.key} className={`flex items-center gap-2 text-xs ${rule.valid ? 'text-primary' : 'text-muted-foreground'}`}>
                {rule.valid ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                <span>{t(`auth.passwordRules.${rule.key}`)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <PasswordField id="register-confirm-password" label={t('auth.confirmPassword')} value={form.confirmPassword} onChange={(value) => update('confirmPassword', value)} error={confirmPasswordError} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-register-confirm-password" inputTestId="input-register-confirm-password" />
          {form.confirmPassword && !confirmPasswordError && form.password === form.confirmPassword && (
            <p className="flex items-center gap-2 text-xs font-medium text-primary" role="status" data-testid="success-register-confirm-password">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('auth.validation.passwordMatch')}
            </p>
          )}
        </div>
        <div className="space-y-2 pt-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted-foreground" htmlFor="register-terms">
            <Checkbox id="register-terms" checked={terms} onCheckedChange={(checked) => setTerms(checked === true)} aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? 'register-terms-error' : undefined} data-testid="checkbox-accept-terms" className="mt-1" />
            <span>{t('auth.register.acceptTerms')} <a href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline" data-testid="link-terms">{t('auth.register.terms')}</a></span>
          </label>
          <FieldError id="register-terms-error" message={errors.terms} testId="error-register-terms" />
        </div>
          <AuthSubmitButton loading={isSubmitting} label={t('auth.register.submit')} loadingLabel={t('common.loading')} testId="button-register-submit" />
      </form>
      <AuthFeedbackDialog
        open={feedback !== null || googleAuthRequested}
        kind={feedback === 'error' ? 'error' : 'success'}
        title={googleAuthRequested ? t('auth.socialLogin.title') : feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.register.successTitle')}
        description={googleAuthRequested ? t('auth.socialLogin.description') : feedback === 'error' ? feedbackMessage || t('auth.feedback.errorDescription') : t('auth.register.successDescription')}
        actionLabel={googleAuthRequested || feedback === 'error' ? t('auth.feedback.close') : t('auth.register.verifyEmail')}
        onOpenChange={(open) => {
          if (!open) {
            setFeedback(null);
            setGoogleAuthRequested(false);
          }
        }}
        onAction={() => {
          const current = feedback;
          setFeedback(null);
          setGoogleAuthRequested(false);
          if (current === 'success') setLocation(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
        }}
      />
    </AuthLayout>
  );
}