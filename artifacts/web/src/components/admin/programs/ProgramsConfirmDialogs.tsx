import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminProgram } from '@/services/adminPrograms';
import type { ProgramStatusAction } from '@/hooks/useAdminPrograms';

interface ConfirmProps {
  program: AdminProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}

function BaseConfirm({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  title,
  description,
  actionLabel,
  destructive,
  testId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  testId: string;
}) {
  const { t } = useLocale();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('admin.programs.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={
              destructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
            data-testid={`${testId}-confirm`}
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Activate / deactivate / archive confirmation, driven by the action. */
export function ProgramStatusConfirmDialog({
  action,
  ...props
}: ConfirmProps & { action: ProgramStatusAction | null }) {
  const { t } = useLocale();
  if (!props.program || !action) return null;
  return (
    <BaseConfirm
      {...props}
      title={t(`admin.programs.${action}Title`)}
      description={t(`admin.programs.${action}Description`)}
      actionLabel={t(
        `admin.programs.action${action.charAt(0).toUpperCase()}${action.slice(1)}`,
      )}
      destructive={action === 'archive'}
      testId={`dialog-confirm-program-${action}`}
    />
  );
}

/** Delete confirmation. */
export function ProgramDeleteConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.program) return null;
  return (
    <BaseConfirm
      {...props}
      title={t('admin.programs.deleteTitle')}
      description={t('admin.programs.deleteDescription')}
      actionLabel={t('admin.programs.actionDelete')}
      destructive
      testId="dialog-confirm-program-delete"
    />
  );
}
