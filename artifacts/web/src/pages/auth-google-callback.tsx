import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { AuthFooterLink, AuthLayout, FormError } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { consumeGoogleRedirect } from '@/lib/googleAuth';
import { getApiError } from '@/services/api';

/**
 * Landing page for the Laravel Google OAuth callback.
 *
 * Laravel redirects here with either `?code=` (a single-use claim code) or
 * `?error=` (a stable reason code). The code is exchanged over XHR for the same
 * bearer token the password login issues, so from here on a Google user is an
 * ordinary authenticated user.
 */

// Mirrors the reason codes GoogleAuthController can emit.
const KNOWN_ERRORS = new Set([
  'cancelled',
  'invalid_state',
  'missing_email',
  'missing_google_id',
  'email_linked_to_other_google_account',
  'account_disabled',
  'provider_unavailable',
  'provider_error',
  'callback_failed',
  'google_not_configured',
  'invalid_or_expired_code',
]);

function getPostLoginPath(roleSlug?: string): string {
  switch (roleSlug) {
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/admin/news';
    default:
      return '/';
  }
}

export default function GoogleCallbackPage() {
  const { t } = useLocale();
  const { loginWithGoogleCode } = useAuth();
  const [, setLocation] = useLocation();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // React 18 StrictMode double-invokes effects in development; the claim code is
  // single-use, so a second exchange would fail against an already-redeemed code.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      setErrorKey(KNOWN_ERRORS.has(error) ? error : 'generic');
      return;
    }

    if (!code) {
      setErrorKey('callback_failed');
      return;
    }

    void (async () => {
      try {
        const user = await loginWithGoogleCode(code);
        const target = consumeGoogleRedirect() ?? getPostLoginPath(user.role?.slug);
        // Replace so the code never stays in history.
        window.history.replaceState({}, '', '/auth/google/callback');
        setLocation(target, { replace: true });
      } catch (exception) {
        const apiError = getApiError(exception);
        const reason = apiError.fields.code;
        setErrorKey(
          reason && KNOWN_ERRORS.has(reason)
            ? reason
            : apiError.status
              ? 'invalid_or_expired_code'
              // No HTTP status means the request never reached Laravel.
              : 'provider_unavailable',
        );
      }
    })();
  }, [loginWithGoogleCode, setLocation]);

  return (
    <AuthLayout
      eyebrow={t('auth.socialLogin.google')}
      title={errorKey ? t('auth.socialLogin.failedTitle') : t('auth.socialLogin.title')}
      description={errorKey ? '' : t('auth.socialLogin.connecting')}
      footer={
        <AuthFooterLink
          prompt=""
          label={t('auth.socialLogin.backToLogin')}
          href="/login"
          testId="link-google-callback-login"
        />
      }
    >
      {errorKey ? (
        <FormError message={t(`auth.socialLogin.errors.${errorKey}`)} />
      ) : (
        <div
          className="flex items-center justify-center gap-3 py-10 text-muted-foreground"
          data-testid="google-callback-pending"
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">{t('auth.socialLogin.connecting')}</span>
        </div>
      )}
    </AuthLayout>
  );
}
