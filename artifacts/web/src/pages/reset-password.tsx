import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { authApi } from '@/services/auth';
import { getApiError } from '@/services/api';

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) nextErrors.password = t('auth.validation.passwordWeak');
    if (!confirmPassword) nextErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    else if (password !== confirmPassword) nextErrors.confirmPassword = t('auth.validation.passwordMismatch');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0 && !isSubmitting) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || '';
      const email = params.get('email') || '';
      setFeedbackMessage('');
      setIsSubmitting(true);
      try {
        await authApi.resetPassword({
          token,
          email,
          password,
          password_confirmation: confirmPassword,
        });
        setFeedback('success');
      } catch (error) {
        const apiError = getApiError(error);
        setFeedbackMessage(apiError.message);
        setErrors((current) => ({
          ...current,
          ...(apiError.fields.email ? { password: apiError.fields.email } : {}),
        }));
        setFeedback('error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthLayout eyebrow={t('auth.reset.eyebrow')} title={t('auth.reset.title')} description={t('auth.reset.description')} footer={<AuthFooterLink prompt={t('auth.reset.remembered')} label={t('auth.reset.backToLogin')} href="/login" testId="link-reset-back-login" />}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label={t('auth.reset.formLabel')}>
        <PasswordField id="reset-password" label={t('auth.newPassword')} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} testId="field-reset-password" inputTestId="input-reset-password" />
        <PasswordField id="reset-confirm-password" label={t('auth.confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-reset-confirm-password" inputTestId="input-reset-confirm-password" />
        <p className="text-xs leading-5 text-muted-foreground">{t('auth.passwordHint')}</p>
         <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-reset-password">{isSubmitting ? t('common.loading') : t('auth.reset.submit')}</Button>
      </form>
      <AuthFeedbackDialog
        open={feedback !== null}
        kind={feedback ?? 'success'}
        title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.reset.successTitle')}
         description={feedback === 'error' ? feedbackMessage || t('auth.feedback.errorDescription') : t('auth.reset.successDescription')}
        actionLabel={feedback === 'error' ? t('auth.feedback.close') : t('auth.feedback.signIn')}
        onOpenChange={(open) => !open && setFeedback(null)}
        onAction={() => {
          const current = feedback;
          setFeedback(null);
          if (current === 'success') setLocation('/login');
        }}
      />
    </AuthLayout>
  );
}