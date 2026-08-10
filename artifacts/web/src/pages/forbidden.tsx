import { Link } from 'wouter';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';

/** 403 page shown to authenticated users who lack the required role. */
export default function ForbiddenPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold tracking-widest text-destructive">
          403
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          {t('forbidden.title')}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t('forbidden.description')}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild data-testid="button-forbidden-home">
            <Link href="/">{t('forbidden.backHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
