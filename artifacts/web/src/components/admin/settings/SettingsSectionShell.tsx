import type { ReactNode } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';

interface SettingsSectionShellProps {
  title: string;
  description: string;
  children: ReactNode;
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
  onReset: () => void;
  testId: string;
}

/** Card wrapper with the shared Save / Reset footer for every section. */
export function SettingsSectionShell({
  title,
  description,
  children,
  isDirty,
  isPending,
  onSave,
  onReset,
  testId,
}: SettingsSectionShellProps) {
  const { t } = useLocale();
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      <Separator />
      <CardFooter className="flex flex-wrap justify-end gap-2 py-4">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || isPending}
          onClick={onReset}
          data-testid={`${testId}-reset`}
        >
          <RotateCcw className="me-1.5 h-4 w-4" />
          {t('admin.settings.resetChanges')}
        </Button>
        <Button
          type="button"
          disabled={!isDirty || isPending}
          onClick={onSave}
          data-testid={`${testId}-save`}
        >
          {isPending ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-1.5 h-4 w-4" />
          )}
          {t('admin.settings.saveChanges')}
        </Button>
      </CardFooter>
    </Card>
  );
}
