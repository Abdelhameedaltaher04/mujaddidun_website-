import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Mail, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/icon-input';
import { AuthFooterLink, AuthLayout } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { authApi } from '@/services/auth';
import { getApiError } from '@/services/api';

type VerificationState = 'loading' | 'success' | 'error';

const COOLDOWN_SECONDS = 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyEmailPage() {
  const { t } = useLocale();
  const [state, setState] = useState<VerificationState>('loading');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const verificationParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      id: params.get('id') || '',
      hash: params.get('hash') || '',
      expires: params.get('expires') || '',
      signature: params.get('signature') || '',
      email: params.get('email') || '',
    };
  }, []);

  useEffect(() => {
    setEmail(verificationParams.email);

    if (
      !verificationParams.id ||
      !verificationParams.hash ||
      !verificationParams.expires ||
      !verificationParams.signature
    ) {
      setState('error');
      return;
    }

    let active = true;
    void authApi
      .verifyEmail(verificationParams.id, verificationParams.hash, {
        expires: verificationParams.expires,
        signature: verificationParams.signature,
      })
      .then(() => {
        if (active) setState('success');
      })
      .catch(() => {
        if (active) setState('error');
      });

    return () => {
      active = false;
    };
  }, [verificationParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError(t('auth.validation.emailRequired'));
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setEmailError(t('auth.validation.emailInvalid'));
      return;
    }
    if (isResending || resendCooldown > 0) return;

    setEmailError('');
    setResendError('');
    setIsResending(true);
    try {
      await authApi.resendVerification(normalizedEmail);
      setResendCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      const apiError = getApiError(error);
      const retryAfter = Number(apiError.fields.retry_after);
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        setResendCooldown(retryAfter);
      }
      setResendError(apiError.message);
    } finally {
      setIsResending(false);
    }
  };

  const isLoading = state === 'loading';
  const isSuccess = state === 'success';

  return (
    <AuthLayout
      eyebrow={t('auth.verify.eyebrow')}
      title={
        isLoading
          ? t('auth.verify.loadingTitle')
          : isSuccess
            ? t('auth.verify.successTitle')
            : t('auth.verify.errorTitle')
      }
      description={
        isLoading
          ? t('auth.verify.loadingDescription')
          : isSuccess
            ? t('auth.verify.successDescription')
            : t('auth.verify.errorDescription')
      }
      footer={
        <AuthFooterLink
          prompt={t('auth.verify.haveAccount')}
          label={t('auth.verify.signIn')}
          href="/login"
          testId="link-verify-login"
        />
      }
    >
      <div className="space-y-6">
        <div
          className={`mx-auto grid h-24 w-24 place-items-center rounded-[28px] ${
            isLoading
              ? 'bg-primary/10 text-primary'
              : isSuccess
                ? 'bg-[#e5f4ef] text-primary'
                : 'bg-[#fff0eb] text-secondary'
          }`}
          aria-live="polite"
          data-testid="verification-status-icon"
        >
          {isLoading ? (
            <RefreshCw className="h-10 w-10 animate-spin" aria-hidden="true" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
          ) : (
            <XCircle className="h-12 w-12" aria-hidden="true" />
          )}
        </div>

        {isSuccess ? (
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-bold"
            onClick={() => window.location.assign('/login')}
            data-testid="button-verify-login"
          >
            {t('auth.verify.goToLogin')}
          </Button>
        ) : (
          !isLoading && (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-white p-5">
              <div className="space-y-2">
                <label
                  htmlFor="verification-email"
                  className="block text-sm font-semibold text-foreground"
                >
                  {t('auth.email')}
                </label>
                <IconInput
                  icon={Mail}
                  id="verification-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'verification-email-error' : undefined}
                  data-testid="input-verification-email"
                  className="h-12 rounded-xl border-border bg-white text-base shadow-none"
                />
                {emailError && (
                  <p
                    id="verification-email-error"
                    className="text-xs font-medium text-destructive"
                    role="alert"
                    data-testid="error-verification-email"
                  >
                    {emailError}
                  </p>
                )}
              </div>
              {resendError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {resendError}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={isResending || resendCooldown > 0}
                className="h-12 w-full rounded-xl text-base font-bold"
                onClick={() => void handleResend()}
                data-testid="button-resend-verification"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {isResending
                  ? t('common.loading')
                  : resendCooldown > 0
                    ? t('auth.verify.resendCooldown', { seconds: resendCooldown })
                    : t('auth.verify.resend')}
              </Button>
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t('auth.verify.expirationNotice')}
              </p>
            </div>
          )
        )}
      </div>
    </AuthLayout>
  );
}