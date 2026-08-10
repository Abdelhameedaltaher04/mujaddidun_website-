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
import type { AdminEvent } from '@/services/adminEvents';

interface ConfirmProps {
  event: AdminEvent | null;
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
            {t('admin.events.cancel')}
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

/** Publish / unpublish confirmation. */
export function EventPublishConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.event) return null;
  const publishing = props.event.status === 'draft';
  return (
    <BaseConfirm
      {...props}
      title={
        publishing
          ? t('admin.events.publishTitle')
          : t('admin.events.unpublishTitle')
      }
      description={
        publishing
          ? t('admin.events.publishDescription')
          : t('admin.events.unpublishDescription')
      }
      actionLabel={
        publishing
          ? t('admin.events.actionPublish')
          : t('admin.events.actionUnpublish')
      }
      testId="dialog-confirm-event-publish"
    />
  );
}

/** Cancel event confirmation (destructive-ish; closes registration). */
export function EventCancelConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.event) return null;
  return (
    <BaseConfirm
      {...props}
      title={t('admin.events.cancelEventTitle')}
      description={t('admin.events.cancelEventDescription')}
      actionLabel={t('admin.events.actionCancel')}
      destructive
      testId="dialog-confirm-event-cancel"
    />
  );
}

/** Delete confirmation. */
export function EventDeleteConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.event) return null;
  return (
    <BaseConfirm
      {...props}
      title={t('admin.events.deleteTitle')}
      description={t('admin.events.deleteDescription')}
      actionLabel={t('admin.events.actionDelete')}
      destructive
      testId="dialog-confirm-event-delete"
    />
  );
}
