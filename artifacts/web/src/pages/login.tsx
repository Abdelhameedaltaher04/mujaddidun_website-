import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { IconInput } from '@/components/ui/icon-input';
import { Mail } from 'lucide-react';
import { AuthDivider, AuthFeedbackDialog, AuthFooterLink, AuthLayout, AuthSubmitButton, FieldError, FormError, GoogleAuthButton, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { startGoogleSignIn } from '@/lib/googleAuth';
import { getApiError } from '@/services/api';

interface LoginErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin-only frontend routes (see AdminRoute usage in App.tsx): dashboard,
// user management, and settings are admin-only; other /admin sections allow
// moderators too.
const ADMIN_ONLY_PATHS = ['/admin/dashboard', '/admin/users', '/admin/settings'];

/**
 * A `?redirect=` target is only honored when the authenticated role may
 * actually visit it; otherwise the role's default destination is used.
 * This is a UX guard only — AdminRoute and Laravel still enforce access.
 */
function isRedirectAllowedForRole(redirect: string, roleSlug?: string): boolean {
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return false;
  const path = redirect.split('?')[0];
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  if (!isAdminPath) return true;
  if (roleSlug === 'admin') return true;
  if (roleSlug === 'moderator') {
    return !ADMIN_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  }
  return false;
}

function getPostLoginPath(roleSlug?: string): string {
  switch (roleSlug) {
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      // Moderators are staff but the dashboard stats page is admin-only;
      // send them to the first admin section their role authorizes.
      return '/admin/news';
    default:
      // Volunteers and regular users get the normal public experience.
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
  const [feedback, setFeedback] = useState<'success' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [postLoginPath, setPostLoginPath] = useState('/');
  const [loggedInRole, setLoggedInRole] = useState<string | undefined>(undefined);
  const [googleAuthRequested, setGoogleAuthRequested] = useState(false);

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
    setFormError('');
    try {
      const authenticatedUser = await login(email.trim(), password, remember);
      setLoggedInRole(authenticatedUser.role?.slug);
      setPostLoginPath(getPostLoginPath(authenticatedUser.role?.slug));
      setFeedback('success');
    } catch (error) {
      const apiError = getApiError(error);
      const nextFields: LoginErrors = {};
      if (apiError.fields.email) nextFields.email = apiError.fields.email;
      if (apiError.fields.password) nextFields.password = apiError.fields.password;
      if (apiError.status === 401 && !nextFields.password) {
        nextFields.password = t('auth.login.invalidCredentials');
      }
      setErrors(nextFields);
      if (apiError.status === 429) {
        setRateLimitSeconds(apiError.retryAfter || 60);
      }
      setFormError(
        apiError.fields.code === 'email_not_verified'
          ? t('auth.login.emailNotVerified')
          : apiError.status === 403 && apiError.fields.code === 'account_disabled'
            ? t('auth.login.accountDisabled')
            : apiError.status === 429
              ? t('auth.login.rateLimitCountdown', { seconds: apiError.retryAfter || 60 })
              : apiError.status === 401
                ? ''
                : apiError.message,
      );
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
      <div className="mb-5 space-y-3">
        <GoogleAuthButton
          label={t('auth.socialLogin.loginWithGoogle')}
          onClick={() => {
            setGoogleAuthRequested(true);
            // Hand the browser to Laravel, which owns the OAuth exchange.
            startGoogleSignIn(new URLSearchParams(window.location.search).get('redirect') ?? undefined);
          }}
          testId="button-login-google"
          disabled={isSubmitting || rateLimitSeconds > 0 || googleAuthRequested}
        />
        <AuthDivider />
      </div>

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
            disabled={isSubmitting || rateLimitSeconds > 0}
            autoFocus
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
          disabled={isSubmitting || rateLimitSeconds > 0}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground" htmlFor="login-remember">
            <Checkbox
              id="login-remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
                disabled={isSubmitting || rateLimitSeconds > 0}
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
         <FormError message={formError} testId="error-login-form" />
      </form>

      {/* Google sign-in now navigates straight to Laravel, so it no longer
          opens this dialog — `googleAuthRequested` only disables the button
          while the browser is leaving the page. */}
      <AuthFeedbackDialog
        open={feedback !== null}
        kind="success"
        title={t('auth.login.successTitle')}
        description={t('auth.login.successDescription')}
        actionLabel={t('auth.feedback.continue')}
        onOpenChange={(open) => {
          if (!open) {
            setFeedback(null);
          }
        }}
        onAction={() => {
          const current = feedback;
          setFeedback(null);
           if (current === 'success') {
             const params = new URLSearchParams(window.location.search);
             const redirect = params.get('redirect');
             setLocation(
               redirect && isRedirectAllowedForRole(redirect, loggedInRole)
                 ? redirect
                 : postLoginPath,
             );
           }
        }}
      />
    </AuthLayout>
  );
}