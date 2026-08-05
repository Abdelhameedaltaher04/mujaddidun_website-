import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, AuthSubmitButton, FormError, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { authApi } from '@/services/auth';
import { getApiError } from '@/services/api';

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [feedback, setFeedback] = useState<'success' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
      setFormError('');
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
        setErrors((current) => ({
          ...current,
          ...(apiError.fields.email ? { password: apiError.fields.email } : {}),
          ...(apiError.fields.password ? { password: apiError.fields.password } : {}),
          ...(apiError.fields.password_confirmation ? { confirmPassword: apiError.fields.password_confirmation } : {}),
        }));
        setFormError(
          apiError.fields.email || apiError.fields.password || apiError.fields.password_confirmation
            ? ''
            : apiError.message,
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthLayout eyebrow={t('auth.reset.eyebrow')} title={t('auth.reset.title')} description={t('auth.reset.description')} footer={<AuthFooterLink prompt={t('auth.reset.remembered')} label={t('auth.reset.backToLogin')} href="/login" testId="link-reset-back-login" />}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label={t('auth.reset.formLabel')}>
        <PasswordField id="reset-password" label={t('auth.newPassword')} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" autoFocus placeholder={t('auth.passwordPlaceholder')} testId="field-reset-password" inputTestId="input-reset-password" disabled={isSubmitting} />
        <PasswordField id="reset-confirm-password" label={t('auth.confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-reset-confirm-password" inputTestId="input-reset-confirm-password" disabled={isSubmitting} />
        <p className="text-xs leading-5 text-muted-foreground">{t('auth.passwordHint')}</p>
        <FormError message={formError} testId="error-reset-form" />
         <AuthSubmitButton loading={isSubmitting} label={t('auth.reset.submit')} loadingLabel={t('common.loading')} testId="button-reset-password" />
      </form>
      <AuthFeedbackDialog
        open={feedback !== null}
        kind="success"
        title={t('auth.reset.successTitle')}
        description={t('auth.reset.successDescription')}
        actionLabel={t('auth.feedback.signIn')}
        onOpenChange={(open) => !open && setFeedback(null)}
        onAction={() => {
          setFeedback(null);
          setLocation('/login');
        }}
      />
    </AuthLayout>
  );
}