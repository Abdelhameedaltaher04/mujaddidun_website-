import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AuthFeedbackDialog, AuthFooterLink, AuthLayout, PasswordField } from '@/components/auth/AuthLayout';
import { useLocale } from '@/contexts/LocaleContext';

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!password) nextErrors.password = t('auth.validation.passwordRequired');
    else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) nextErrors.password = t('auth.validation.passwordWeak');
    if (!confirmPassword) nextErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    else if (password !== confirmPassword) nextErrors.confirmPassword = t('auth.validation.passwordMismatch');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // Placeholder-only failure path until the real reset API is connected.
      setFeedback(password.toLowerCase().includes('error') ? 'error' : 'success');
    }
  };

  return (
    <AuthLayout eyebrow={t('auth.reset.eyebrow')} title={t('auth.reset.title')} description={t('auth.reset.description')} footer={<AuthFooterLink prompt={t('auth.reset.remembered')} label={t('auth.reset.backToLogin')} href="/login" testId="link-reset-back-login" />}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label={t('auth.reset.formLabel')}>
        <PasswordField id="reset-password" label={t('auth.newPassword')} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} testId="field-reset-password" inputTestId="input-reset-password" />
        <PasswordField id="reset-confirm-password" label={t('auth.confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} autoComplete="new-password" placeholder={t('auth.confirmPasswordPlaceholder')} testId="field-reset-confirm-password" inputTestId="input-reset-confirm-password" />
        <p className="text-xs leading-5 text-muted-foreground">{t('auth.passwordHint')}</p>
        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" data-testid="button-reset-password">{t('auth.reset.submit')}</Button>
      </form>
      <AuthFeedbackDialog
        open={feedback !== null}
        kind={feedback ?? 'success'}
        title={feedback === 'error' ? t('auth.feedback.errorTitle') : t('auth.reset.successTitle')}
        description={feedback === 'error' ? t('auth.feedback.errorDescription') : t('auth.reset.successDescription')}
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