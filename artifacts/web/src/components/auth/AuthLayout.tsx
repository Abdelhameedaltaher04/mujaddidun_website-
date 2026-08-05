import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import logoUrl from '@/assets/mujaddidun-logo.png';
import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface AuthLayoutProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  const { dir, locale, setLocale, t } = useLocale();
  const isArabic = locale === 'ar';

  return (
    <main dir={dir} className="min-h-[100dvh] overflow-hidden bg-[#f7fbfc] text-foreground">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-12">
        <section className="relative flex flex-col justify-between overflow-hidden bg-primary px-6 py-6 text-primary-foreground sm:px-10 lg:order-2 lg:col-span-5 lg:px-14 lg:py-10">
          <div className="pointer-events-none absolute -end-28 -top-28 h-72 w-72 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-36 -start-24 h-96 w-96 rounded-full border-[28px] border-secondary/20" />
          <div className="pointer-events-none absolute end-16 top-36 h-3 w-3 rounded-full bg-secondary" />
          <div className="pointer-events-none absolute bottom-32 start-16 h-5 w-5 rounded-full bg-[#98C8B8]/70" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg focus-ring-standard"
              data-testid="link-auth-brand"
            >
              <span className="relative grid h-11 w-11 place-items-center rounded-[14px] bg-white shadow-sm" aria-hidden="true">
                <span className="absolute h-6 w-6 rounded-full border-[5px] border-primary" />
                <span className="absolute end-1 top-1 h-3 w-3 rounded-full bg-secondary" />
              </span>
              <span className="font-display text-base font-bold tracking-tight">Al-Mujaddidun</span>
            </Link>
            <button
              type="button"
              className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10 focus-ring-standard"
              onClick={() => setLocale(isArabic ? 'en' : 'ar')}
              data-testid="button-auth-language"
              aria-label={t('auth.switchLanguage')}
            >
              {isArabic ? 'English' : 'العربية'}
            </button>
          </div>

          <div className="relative z-10 max-w-md py-12 text-center lg:py-0">
            <div className="mb-8 flex justify-center">
              <span className="inline-flex items-center justify-center rounded-[22px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
                <img
                  src={logoUrl}
                  alt="Al-Mujaddidun"
                  className="h-20 w-auto sm:h-24"
                  data-testid="img-auth-logo"
                />
              </span>
            </div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#bde3d8]">{t('auth.heritageEyebrow')}</p>
            <h2 className="font-display text-3xl font-bold leading-[1.22] tracking-tight sm:text-4xl">
              {t('auth.heritageTitle')}
            </h2>
            <p className="mx-auto mt-6 max-w-sm text-base leading-8 text-white/75">{t('auth.heritageCopy')}</p>
            <div className="mt-10 flex items-center justify-center gap-3 text-sm text-white/80">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#bde3d8]" aria-hidden="true" />
              <span>{t('auth.privacyNote')}</span>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/55">{t('auth.footerNote')}</p>
        </section>

        <section className="flex flex-col px-5 py-6 sm:px-10 lg:order-1 lg:col-span-7 lg:px-20 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-ring-standard"
              data-testid="link-auth-home"
            >
              {isArabic ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              <span>{t('auth.backHome')}</span>
            </Link>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/45">AM / 01</span>
          </div>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[500px]">
              <div className="mb-8">
                {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>}
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-[2.6rem]">{title}</h1>
                <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">{description}</p>
              </div>
              {children}
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  testId: string;
  inputTestId: string;
  onBlur?: () => void;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  testId,
  inputTestId,
  onBlur,
}: PasswordFieldProps) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2" data-testid={testId}>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-muted-foreground/70"
          aria-hidden="true"
        >
          <Lock className="h-[18px] w-[18px]" />
        </span>
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          data-testid={inputTestId}
          className="h-12 rounded-xl border-border bg-white ps-11 pe-12 text-base shadow-none"
        />
        <button
          type="button"
          className="absolute end-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-ring-standard"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          data-testid={`${testId}-toggle`}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive" role="alert" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export type FeedbackKind = 'success' | 'error';

interface AuthFeedbackDialogProps {
  open: boolean;
  kind: FeedbackKind;
  title: string;
  description: string;
  actionLabel: string;
  onOpenChange: (open: boolean) => void;
  onAction?: () => void;
}

export function AuthFeedbackDialog({
  open,
  kind,
  title,
  description,
  actionLabel,
  onOpenChange,
  onAction,
}: AuthFeedbackDialogProps) {
  const { dir } = useLocale();
  const isSuccess = kind === 'success';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md rounded-2xl border-border p-7">
        <DialogHeader className="text-start">
          <div className={`mb-3 grid h-12 w-12 place-items-center rounded-2xl ${isSuccess ? 'bg-[#e5f4ef] text-primary' : 'bg-[#fff0eb] text-secondary'}`}>
            {isSuccess ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <AlertTriangle className="h-6 w-6" aria-hidden="true" />}
          </div>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription className="pt-1 text-start leading-7">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 sm:justify-start">
          <Button
            type="button"
            onClick={onAction}
            className="rounded-xl px-6"
            data-testid={`button-feedback-${kind}`}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AuthFooterLink({ prompt, label, href, testId }: { prompt: string; label: string; href: string; testId: string }) {
  return (
    <p className="mt-7 text-center text-sm text-muted-foreground">
      {prompt}{' '}
      <Link href={href} className="font-bold text-primary underline-offset-4 hover:underline focus-ring-standard" data-testid={testId}>
        {label}
      </Link>
    </p>
  );
}

export function FieldError({ id, message, testId }: { id: string; message?: string; testId: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive" role="alert" data-testid={testId}>
      {message}
    </p>
  );
}