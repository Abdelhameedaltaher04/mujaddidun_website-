import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/icon-input';
import { CheckCircle2, ChevronDown, Mail, Phone, User, XCircle } from 'lucide-react';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, FieldError, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';

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

type Country = {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
};

const COUNTRIES: Country[] = getCountries().map((code) => ({
  code,
  name: code,
  dialCode: `+${getCountryCallingCode(code)}`,
  flag: code.replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))),
}));
const DEFAULT_COUNTRY = COUNTRIES.find((country) => country.code === 'JO') ?? COUNTRIES[0];

const PASSWORD_RULES = [
  { key: 'length', test: (value: string) => value.length >= 8 },
  { key: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lowercase', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', test: (value: string) => /\d/.test(value) },
  { key: 'special', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export default function RegisterPage() {
  const { dir, locale, t } = useLocale();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '+962', password: '', confirmPassword: '' });
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const phoneDigits = form.phone.startsWith(selectedCountry.dialCode)
    ? form.phone.slice(selectedCountry.dialCode.length).replace(/\D/g, '')
    : form.phone.replace(/\D/g, '');
  const passwordRules = PASSWORD_RULES.map((rule) => ({ ...rule, valid: rule.test(form.password) }));
  const confirmPasswordError = form.confirmPassword && form.password !== form.confirmPassword
    ? t('auth.validation.passwordMismatch')
    : errors.confirmPassword;

  const selectCountry = (country: Country) => {
    const currentDigits = form.phone.startsWith(selectedCountry.dialCode)
      ? form.phone.slice(selectedCountry.dialCode.length).replace(/\D/g, '')
      : form.phone.replace(/\D/g, '');
    setSelectedCountry(country);
    setCountryPickerOpen(false);
    update('phone', `${country.dialCode}${currentDigits}`);
  };

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('auth.validation.firstNameRequired');
    if (!form.lastName.trim()) nextErrors.lastName = t('auth.validation.lastNameRequired');
    if (!form.email.trim()) nextErrors.email = t('auth.validation.emailRequired');
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = t('auth.validation.emailInvalid');
    if (!phoneDigits) nextErrors.phone = t('auth.validation.phoneRequired');
    else if (!isValidPhoneNumber(form.phone, selectedCountry.code)) nextErrors.phone = t('auth.validation.phoneInvalidCountry');
    if (!form.password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (passwordRules.some((rule) => !rule.valid)) nextErrors.password = t('auth.validation.passwordWeak');
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
          <div className="flex gap-2" dir="ltr">
            <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground shadow-none transition-colors hover:border-primary focus-ring-standard"
                  aria-label={t('auth.selectCountry')}
                  data-testid="button-register-country"
                >
                  <span className="text-lg leading-none" aria-hidden="true">{selectedCountry.flag}</span>
                  <span>{selectedCountry.dialCode}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[280px] p-0" dir={dir}>
                <Command>
                  <CommandInput placeholder={t('auth.countrySearch')} />
                  <CommandList>
                    <CommandEmpty>{t('auth.noCountriesFound')}</CommandEmpty>
                    {COUNTRIES.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${new Intl.DisplayNames([locale === 'ar' ? 'ar' : 'en'], { type: 'region' }).of(country.code) ?? country.code} ${country.code} ${country.dialCode}`}
                        onSelect={() => selectCountry(country)}
                        className="gap-3 py-2.5"
                      >
                        <span className="text-lg leading-none" aria-hidden="true">{country.flag}</span>
                        <span className="flex-1">{new Intl.DisplayNames([locale === 'ar' ? 'ar' : 'en'], { type: 'region' }).of(country.code) ?? country.code}</span>
                        <span className="text-xs text-muted-foreground" dir="ltr">{country.dialCode}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <IconInput icon={Phone} id="register-phone" type="tel" value={phoneDigits} onChange={(event) => update('phone', `${selectedCountry.dialCode}${event.target.value.replace(/\D/g, '')}`)} autoComplete="tel" placeholder={t('auth.phonePlaceholder')} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'register-phone-error' : undefined} data-testid="input-register-phone" className="h-12 min-w-0 flex-1 rounded-xl border-border bg-white text-base shadow-none" />
          </div>
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
        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-register-submit">{t('auth.register.submit')}</Button>
      </form>
      <AuthFeedbackDialog open={feedback !== null} kind={feedback ?? 'success'} title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.register.successTitle')} description={feedback === 'error' ? t('auth.feedback.errorDescription') : t('auth.register.successDescription')} actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.feedback.signIn')} onOpenChange={(open) => !open && setFeedback(null)} onAction={() => { const current = feedback; setFeedback(null); if (current === 'success') setLocation('/login'); }} />
    </AuthLayout>
  );
}