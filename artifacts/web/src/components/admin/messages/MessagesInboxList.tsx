import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { ContactMessage } from '@/services/adminMessages';
import { MessageStatusBadge } from '@/components/admin/messages/messageBadges';

interface MessagesInboxListProps {
  messages: ContactMessage[];
  selectedId: number | null;
  onSelect: (message: ContactMessage) => void;
}

/**
 * Inbox-style message list. Unread messages are bold with an accent dot.
 * Used as the sidebar on desktop and the primary view on mobile.
 */
export function MessagesInboxList({
  messages,
  selectedId,
  onSelect,
}: MessagesInboxListProps) {
  const { locale } = useLocale();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <ul className="divide-y divide-border" data-testid="messages-inbox-list">
      {messages.map((message) => {
        const selected = message.id === selectedId;
        return (
          <li key={message.id}>
            <button
              type="button"
              onClick={() => onSelect(message)}
              className={cn(
                'w-full px-4 py-3 text-start transition-colors hover:bg-muted/60',
                selected && 'bg-muted',
              )}
              data-testid={`message-item-${message.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {!message.is_read ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-primary"
                      data-testid={`unread-dot-${message.id}`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <p
                    dir="auto"
                    className={cn(
                      'truncate text-sm',
                      message.is_read
                        ? 'text-foreground'
                        : 'font-bold text-foreground',
                    )}
                  >
                    {message.sender_name}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(message.received_at)}
                </span>
              </div>
              <p
                dir="auto"
                className={cn(
                  'mt-0.5 truncate text-sm',
                  message.is_read
                    ? 'text-muted-foreground'
                    : 'font-semibold text-foreground',
                )}
              >
                {message.subject}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  {message.body.replace(/\s+/g, ' ').slice(0, 80)}
                </p>
                <MessageStatusBadge status={message.status} />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
