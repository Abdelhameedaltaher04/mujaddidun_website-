import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Inbox, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { MessagesStats } from '@/components/admin/messages/MessagesStats';
import {
  EMPTY_MESSAGES_FILTERS,
  MessagesFilters,
  type MessagesFiltersValue,
} from '@/components/admin/messages/MessagesFilters';
import { MessagesInboxList } from '@/components/admin/messages/MessagesInboxList';
import { MessageDetailsPanel } from '@/components/admin/messages/MessageDetailsPanel';
import { ReplyMessageDialog } from '@/components/admin/messages/ReplyMessageDialog';
import {
  useAdminMessage,
  useAdminMessagesList,
  useArchiveMessage,
  useDeleteMessage,
  useMessageStatistics,
  useReplyToMessage,
  useSetMessageRead,
  useSetMessageStatus,
} from '@/hooks/useAdminMessages';
import type {
  ContactMessage,
  MessageStatus,
  MessagesListParams,
} from '@/services/adminMessages';

type DialogKind = 'archive' | 'delete' | 'reply' | null;

/**
 * Contact messages inbox: stats, combined filters, split inbox/details
 * layout on desktop, list-first with a separate details view on mobile.
 */
export default function AdminMessagesPage() {
  const { t, dir } = useLocale();
  const { toast } = useToast();

  const [filters, setFilters] = useState<MessagesFiltersValue>(
    EMPTY_MESSAGES_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  /** Mobile-only: show the details view instead of the list. */
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);

  const params = useMemo<MessagesListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      read:
        filters.read === 'read'
          ? true
          : filters.read === 'unread'
            ? false
            : undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as MessageStatus)
          : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminMessagesList(params);
  const stats = useMessageStatistics();
  const detail = useAdminMessage(selectedId);
  const setRead = useSetMessageRead();
  const setStatus = useSetMessageStatus();
  const archive = useArchiveMessage();
  const remove = useDeleteMessage();
  const reply = useReplyToMessage();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.messages.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: MessagesFiltersValue) => {
    setFilters(value);
    setPage(1);
    // The open message may no longer match the new filters — reset the
    // split view so the list and details never disagree.
    setSelectedId(null);
    setMobileDetailsOpen(false);
  };

  const message = detail.data ?? null;

  // Auto-mark-read happens only on the open event (selecting an unread
  // message), so an explicit "Mark as Unread" on the open message sticks.
  const handleSelect = (item: ContactMessage) => {
    setSelectedId(item.id);
    setMobileDetailsOpen(true);
    if (!item.is_read) {
      setRead.mutate({ id: item.id, isRead: true });
    }
  };

  const handleToggleRead = (item: ContactMessage) => {
    setRead.mutate(
      { id: item.id, isRead: !item.is_read },
      {
        onSuccess: () =>
          toast({
            description: item.is_read
              ? t('admin.messages.markedUnread')
              : t('admin.messages.markedRead'),
          }),
        onError: notifyError,
      },
    );
  };

  const handleStatusChange = (item: ContactMessage, status: MessageStatus) => {
    setStatus.mutate(
      { id: item.id, status },
      {
        onSuccess: () =>
          toast({ description: t(`admin.messages.status_${status}_success`) }),
        onError: notifyError,
      },
    );
  };

  const handleArchiveConfirm = () => {
    if (selectedId === null) return;
    archive.mutate(selectedId, {
      onSuccess: () => {
        setDialog(null);
        toast({ description: t('admin.messages.archiveSuccess') });
      },
      onError: notifyError,
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedId === null) return;
    remove.mutate(selectedId, {
      onSuccess: () => {
        setDialog(null);
        setSelectedId(null);
        setMobileDetailsOpen(false);
        toast({ description: t('admin.messages.deleteSuccess') });
      },
      onError: notifyError,
    });
  };

  const handleSendReply = (subject: string, bodyHtml: string) => {
    if (selectedId === null) return;
    reply.mutate(
      { id: selectedId, input: { subject, body_html: bodyHtml } },
      {
        onSuccess: () => {
          setDialog(null);
          toast({ description: t('admin.messages.replySuccess') });
        },
        onError: notifyError,
      },
    );
  };

  const messages = list.data?.data ?? [];
  const hasActiveFilters =
    filters.search !== '' ||
    filters.read !== 'all' ||
    filters.status !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const detailActions = {
    onToggleRead: handleToggleRead,
    onMarkInProgress: (item: ContactMessage) =>
      handleStatusChange(item, 'in_progress'),
    onMarkResolved: (item: ContactMessage) =>
      handleStatusChange(item, 'resolved'),
    onArchive: () => setDialog('archive'),
    onDelete: () => setDialog('delete'),
    onReply: () => setDialog('reply'),
  };

  const detailsContent = detail.isPending && selectedId !== null ? (
    <div className="space-y-3 p-4" data-testid="message-details-loading">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-40 w-full" />
    </div>
  ) : detail.isError ? (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-sm text-destructive">{errorMessage(detail.error)}</p>
      <Button variant="outline" size="sm" onClick={() => detail.refetch()}>
        <RefreshCw className="me-2 h-4 w-4" />
        {t('admin.messages.retry')}
      </Button>
    </div>
  ) : message ? (
    <MessageDetailsPanel message={message} {...detailActions} />
  ) : (
    <div
      className="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center"
      data-testid="message-details-placeholder"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('admin.messages.selectMessage')}
      </p>
    </div>
  );

  const listContent = list.isPending ? (
    <div className="space-y-3 p-4" data-testid="messages-loading">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  ) : list.isError ? (
    <div
      className="flex flex-col items-center gap-3 p-8 text-center"
      data-testid="messages-error"
    >
      <p className="text-sm text-destructive">{errorMessage(list.error)}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list.refetch()}
        data-testid="button-retry-messages"
      >
        <RefreshCw className="me-2 h-4 w-4" />
        {t('admin.messages.retry')}
      </Button>
    </div>
  ) : messages.length === 0 ? (
    <div
      className="flex flex-col items-center gap-3 p-10 text-center"
      data-testid="messages-empty"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">
        {hasActiveFilters
          ? t('admin.messages.noResults')
          : t('admin.messages.emptyState')}
      </p>
      {hasActiveFilters ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFiltersChange(EMPTY_MESSAGES_FILTERS)}
        >
          {t('admin.messages.clearFilters')}
        </Button>
      ) : null}
    </div>
  ) : (
    <div className={list.isFetching ? 'pointer-events-none opacity-60' : undefined}>
      <MessagesInboxList
        messages={messages}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-messages-title"
          >
            {t('admin.messages.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.messages.subtitle')}
          </p>
        </div>

        <MessagesStats stats={stats.data} isLoading={stats.isPending} />

        <MessagesFilters value={filters} onChange={handleFiltersChange} />

        {/* Desktop: split inbox + details. Mobile: list OR details. */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card
            className={`overflow-hidden lg:col-span-2 ${
              mobileDetailsOpen ? 'hidden lg:block' : ''
            }`}
          >
            <CardContent className="p-0">{listContent}</CardContent>
          </Card>

          <Card
            className={`overflow-hidden lg:col-span-3 ${
              mobileDetailsOpen ? '' : 'hidden lg:block'
            }`}
          >
            <CardContent className="p-0">
              {mobileDetailsOpen ? (
                <div className="border-b border-border p-2 lg:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileDetailsOpen(false)}
                    data-testid="button-back-to-inbox"
                  >
                    <BackIcon className="me-1.5 h-4 w-4" />
                    {t('admin.messages.backToInbox')}
                  </Button>
                </div>
              ) : null}
              {detailsContent}
            </CardContent>
          </Card>
        </div>

        {list.data && messages.length > 0 ? (
          <AdminPagination
            meta={list.data.meta}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />
        ) : null}
      </div>

      <GalleryConfirmDialog
        open={dialog === 'archive'}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={archive.isPending}
        title={t('admin.messages.archiveTitle')}
        description={t('admin.messages.archiveDescription')}
        actionLabel={t('admin.messages.actionArchive')}
        testId="dialog-confirm-message-archive"
        onConfirm={handleArchiveConfirm}
      />

      <GalleryConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={remove.isPending}
        title={t('admin.messages.deleteTitle')}
        description={t('admin.messages.deleteDescription')}
        actionLabel={t('admin.messages.actionDelete')}
        destructive
        testId="dialog-confirm-message-delete"
        onConfirm={handleDeleteConfirm}
      />

      <ReplyMessageDialog
        message={message}
        open={dialog === 'reply'}
        isPending={reply.isPending}
        onOpenChange={(open) => !open && setDialog(null)}
        onSend={handleSendReply}
      />
    </AdminLayout>
  );
}
