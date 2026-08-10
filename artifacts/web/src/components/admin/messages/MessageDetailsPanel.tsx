import {
  Archive,
  CheckCircle2,
  Loader,
  Mail,
  MailOpen,
  MoreHorizontal,
  Reply,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import type { ContactMessage } from '@/services/adminMessages';
import { MessageStatusBadge } from '@/components/admin/messages/messageBadges';

export interface MessageDetailActions {
  onToggleRead: (message: ContactMessage) => void;
  onMarkInProgress: (message: ContactMessage) => void;
  onMarkResolved: (message: ContactMessage) => void;
  onArchive: (message: ContactMessage) => void;
  onDelete: (message: ContactMessage) => void;
  onReply: (message: ContactMessage) => void;
}

interface MessageDetailsPanelProps extends MessageDetailActions {
  message: ContactMessage;
}

/** Full message view with read/status/archive/delete/reply actions. */
export function MessageDetailsPanel({
  message,
  ...actions
}: MessageDetailsPanelProps) {
  const { t, locale } = useLocale();
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const canProgress = message.status !== 'in_progress' && message.status !== 'archived';
  const canResolve = message.status !== 'resolved' && message.status !== 'archived';
  const canArchive = message.status !== 'archived';

  return (
    <div className="flex h-full flex-col" data-testid="message-details-panel">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2
            className="break-words text-lg font-semibold text-foreground"
            dir="auto"
            data-testid="text-message-subject"
          >
            {message.subject}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <MessageStatusBadge status={message.status} />
            <span className="text-xs text-muted-foreground">
              {t('admin.messages.receivedAt')}{' '}
              {formatDateTime(message.received_at)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => actions.onReply(message)}
            data-testid="button-message-reply"
          >
            <Reply className="me-1.5 h-4 w-4" />
            {t('admin.messages.reply')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                data-testid="button-message-more-actions"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t('admin.messages.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => actions.onToggleRead(message)}
                data-testid="message-action-toggle-read"
              >
                {message.is_read ? (
                  <Mail className="me-2 h-4 w-4" />
                ) : (
                  <MailOpen className="me-2 h-4 w-4" />
                )}
                {message.is_read
                  ? t('admin.messages.actionMarkUnread')
                  : t('admin.messages.actionMarkRead')}
              </DropdownMenuItem>
              {canProgress ? (
                <DropdownMenuItem
                  onClick={() => actions.onMarkInProgress(message)}
                  data-testid="message-action-in-progress"
                >
                  <Loader className="me-2 h-4 w-4" />
                  {t('admin.messages.actionMarkInProgress')}
                </DropdownMenuItem>
              ) : null}
              {canResolve ? (
                <DropdownMenuItem
                  onClick={() => actions.onMarkResolved(message)}
                  data-testid="message-action-resolve"
                >
                  <CheckCircle2 className="me-2 h-4 w-4" />
                  {t('admin.messages.actionMarkResolved')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              {canArchive ? (
                <DropdownMenuItem
                  onClick={() => actions.onArchive(message)}
                  data-testid="message-action-archive"
                >
                  <Archive className="me-2 h-4 w-4" />
                  {t('admin.messages.actionArchive')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => actions.onDelete(message)}
                className="text-destructive focus:text-destructive"
                data-testid="message-action-delete"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('admin.messages.actionDelete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      <div className="space-y-1 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">
            {t('admin.messages.fields.sender')}:
          </span>{' '}
          <span className="font-medium text-foreground">
            {message.sender_name}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">
            {t('admin.messages.fields.email')}:
          </span>{' '}
          <span className="font-medium text-foreground" dir="ltr">
            {message.email}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">
            {t('admin.messages.fields.phone')}:
          </span>{' '}
          <span className="font-medium text-foreground" dir="ltr">
            {message.phone ?? '—'}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">
            {t('admin.messages.fields.readAt')}:
          </span>{' '}
          <span className="font-medium text-foreground">
            {message.read_at
              ? formatDateTime(message.read_at)
              : t('admin.messages.notReadYet')}
          </span>
        </p>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4">
        <p
          className="whitespace-pre-line text-sm leading-relaxed text-foreground"
          dir="auto"
          data-testid="text-message-body"
        >
          {message.body}
        </p>
      </div>
    </div>
  );
}
