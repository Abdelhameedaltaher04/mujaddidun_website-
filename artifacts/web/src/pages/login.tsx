import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { IconInput } from '@/components/ui/icon-input';
import { Mail } from 'lucide-react';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, AuthSubmitButton, FieldError, PasswordField, SocialLoginButtons } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/api';

interface LoginErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPostLoginPath(roleSlug?: string): string {
  switch (roleSlug) {
    case 'admin':
      // Keep this branch ready for the admin dashboard route.
      return '/';
    case 'moderator':
      // Keep this branch ready for the moderator dashboard route.
      return '/';
    case 'volunteer':
      // Keep this branch ready for the volunteer dashboard route.
      return '/';
    default:
      return '/';
  }
}

export default function LoginPage() {
  const { t } = useLocale();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [postLoginPath, setPostLoginPath] = useState('/');

  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRateLimitSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitSeconds]);

  const validate = () => {
    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = t('auth.validation.emailRequired');
    else if (!emailPattern.test(email.trim())) nextErrors.email = t('auth.validation.emailInvalid');
    if (!password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (password.length < 8) nextErrors.password = t('auth.validation.passwordWeak');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedbackMessage('');
    try {
      const authenticatedUser = await login(email.trim(), password, remember);
      setPostLoginPath(getPostLoginPath(authenticatedUser.role?.slug));
      setFeedback('success');
    } catch (error) {
      const apiError = getApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fields }));
      if (apiError.status === 429) {
        setRateLimitSeconds(apiError.retryAfter || 60);
      }
      setFeedbackMessage(
        apiError.fields.code === 'email_not_verified'
          ? t('auth.login.emailNotVerified')
          : apiError.status === 401
            ? t('auth.login.invalidCredentials')
            : apiError.status === 403 && apiError.fields.code === 'account_disabled'
              ? t('auth.login.accountDisabled')
          : apiError.message,
      );
      setFeedback('error');
    } finally {
      setIsSubmitting(false);
    }
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
          <IconInput
            icon={Mail}
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

         <AuthSubmitButton
           loading={isSubmitting || rateLimitSeconds > 0}
           label={t('auth.login.submit')}
           loadingLabel={rateLimitSeconds > 0 ? t('auth.login.rateLimitCountdown', { seconds: rateLimitSeconds }) : t('common.loading')}
           testId="button-login-submit"
         />
         {rateLimitSeconds > 0 && (
           <p className="text-center text-xs font-medium text-secondary" role="status" aria-live="polite" data-testid="login-rate-limit">
             {t('auth.login.rateLimitCountdown', { seconds: rateLimitSeconds })}
           </p>
         )}
      </form>

       <div className="mt-6">
         <SocialLoginButtons />
       </div>

      <AuthFeedbackDialog
        open={feedback !== null}
        kind={feedback ?? 'success'}
        title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.login.successTitle')}
        description={feedback === 'error' ? feedbackMessage || t('auth.feedback.errorDescription') : t('auth.login.successDescription')}
        actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.feedback.continue')}
        onOpenChange={(open) => !open && setFeedback(null)}
        onAction={() => {
          const current = feedback;
          setFeedback(null);
           if (current === 'success') {
             const params = new URLSearchParams(window.location.search);
             const redirect = params.get('redirect');
              setLocation(redirect && redirect.startsWith('/') ? redirect : postLoginPath);
           }
        }}
      />
    </AuthLayout>
  );
}