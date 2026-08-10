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
import type { NewsArticle } from '@/services/adminNews';

interface ConfirmProps {
  article: NewsArticle | null;
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
            {t('admin.news.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
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
export function PublishConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.article) return null;
  const publishing = props.article.status !== 'published';
  return (
    <BaseConfirm
      {...props}
      title={
        publishing
          ? t('admin.news.publishTitle')
          : t('admin.news.unpublishTitle')
      }
      description={
        publishing
          ? t('admin.news.publishDescription')
          : t('admin.news.unpublishDescription')
      }
      actionLabel={
        publishing
          ? t('admin.news.actionPublish')
          : t('admin.news.actionUnpublish')
      }
      testId="dialog-confirm-publish"
    />
  );
}

/** Archive confirmation. */
export function ArchiveConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.article) return null;
  return (
    <BaseConfirm
      {...props}
      title={t('admin.news.archiveTitle')}
      description={t('admin.news.archiveDescription')}
      actionLabel={t('admin.news.actionArchive')}
      testId="dialog-confirm-archive"
    />
  );
}

/** Delete confirmation. */
export function DeleteNewsConfirmDialog(props: ConfirmProps) {
  const { t } = useLocale();
  if (!props.article) return null;
  return (
    <BaseConfirm
      {...props}
      title={t('admin.news.deleteTitle')}
      description={t('admin.news.deleteDescription')}
      actionLabel={t('admin.news.actionDelete')}
      destructive
      testId="dialog-confirm-delete-news"
    />
  );
}
