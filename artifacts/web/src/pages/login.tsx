import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, FieldError, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';

interface LoginErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const validate = () => {
    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = t('auth.validation.emailRequired');
    else if (!emailPattern.test(email.trim())) nextErrors.email = t('auth.validation.emailInvalid');
    if (!password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (password.length < 8) nextErrors.password = t('auth.validation.passwordWeak');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setFeedback(email.toLowerCase().includes('error') ? 'error' : 'success');
  };

  return (
    <AuthLayout
      eyebrow={t('auth.login.eyebrow')}
      title={t('auth.login.title')}
      description={t('auth.login.description')}
      footer={<AuthFooterLink prompt={t('auth.login.noAccount')} label={t('auth.login.createAccount')} href="/register" testId="link-register" />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label={t('auth.login.formLabel')}>
        <div className="space-y-2">
          <label htmlFor="login-email" className="block text-sm font-semibold text-foreground">
            {t('auth.email')}
          </label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            data-testid="input-login-email"
            className="h-12 rounded-xl border-border bg-white text-base shadow-none"
          />
          <FieldError id="login-email-error" message={errors.email} testId="error-login-email" />
        </div>

        <PasswordField
          id="login-password"
          label={t('auth.password')}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          placeholder={t('auth.passwordPlaceholder')}
          testId="field-login-password"
          inputTestId="input-login-password"
        />

        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground" htmlFor="login-remember">
            <Checkbox
              id="login-remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
              data-testid="checkbox-remember-me"
            />
            <span>{t('auth.login.rememberMe')}</span>
          </label>
          <Link href="/forgot-password" className="text-sm font-bold text-primary underline-offset-4 hover:underline focus-ring-standard" data-testid="link-forgot-password">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-login-submit">
          {t('auth.login.submit')}
        </Button>
      </form>

      <AuthFeedbackDialog
        open={feedback !== null}
        kind={feedback ?? 'success'}
        title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.login.successTitle')}
        description={feedback === 'error' ? t('auth.feedback.errorDescription') : t('auth.login.successDescription')}
        actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.feedback.continue')}
        onOpenChange={(open) => !open && setFeedback(null)}
        onAction={() => {
          const current = feedback;
          setFeedback(null);
          if (current === 'success') setLocation('/');
        }}
      />
    </AuthLayout>
  );
}