import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/ui/icon-input';
import { Mail } from 'lucide-react';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, FieldError } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) setError(t('auth.validation.emailRequired'));
    else if (!emailPattern.test(email.trim())) setError(t('auth.validation.emailInvalid'));
    else {
      setError('');
      setFeedback(email.toLowerCase().includes('error') ? 'error' : 'success');
    }
  };

  return (
    <AuthLayout eyebrow={t('auth.forgot.eyebrow')} title={t('auth.forgot.title')} description={t('auth.forgot.description')} footer={<AuthFooterLink prompt={t('auth.forgot.remembered')} label={t('auth.forgot.backToLogin')} href="/login" testId="link-forgot-back-login" />}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label={t('auth.forgot.formLabel')}>
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="block text-sm font-semibold text-foreground">{t('auth.email')}</label>
          <IconInput icon={Mail} id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder={t('auth.emailPlaceholder')} aria-invalid={Boolean(error)} aria-describedby={error ? 'forgot-email-error' : undefined} data-testid="input-forgot-email" className="h-12 rounded-xl border-border bg-white text-base shadow-none" />
          <FieldError id="forgot-email-error" message={error} testId="error-forgot-email" />
        </div>
        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-send-reset-link">{t('auth.forgot.submit')}</Button>
      </form>
      <AuthFeedbackDialog open={feedback !== null} kind={feedback ?? 'success'} title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.forgot.successTitle')} description={feedback === 'error' ? t('auth.feedback.errorDescription') : t('auth.forgot.successDescription')} actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.forgot.backToLogin')} onOpenChange={(open) => !open && setFeedback(null)} onAction={() => { setFeedback(null); if (feedback === 'success') setLocation('/login'); }} />
    </AuthLayout>
  );
}