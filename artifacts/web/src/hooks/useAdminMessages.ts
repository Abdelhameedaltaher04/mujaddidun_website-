import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminMessagesApi,
  type ContactMessage,
  type MessageStatus,
  type MessagesListParams,
  type ReplyInput,
} from '@/services/adminMessages';

const KEY_PREFIX = ['admin', 'messages'] as const;

export function useAdminMessagesList(params: MessagesListParams) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'list', params],
    queryFn: () => adminMessagesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMessageStatistics() {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'statistics'],
    queryFn: () => adminMessagesApi.statistics(),
  });
}

export function useAdminMessage(id: number | null) {
  return useQuery({
    queryKey: [...KEY_PREFIX, 'detail', id],
    queryFn: () => adminMessagesApi.get(id as number),
    enabled: id !== null,
  });
}

function useApplyMessageUpdate() {
  const queryClient = useQueryClient();
  // Write the fresh record into the detail cache immediately so the open
  // message never lags behind, then fire-and-forget invalidate the rest.
  return (updated: ContactMessage) => {
    queryClient.setQueryData([...KEY_PREFIX, 'detail', updated.id], updated);
    void queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
  };
}

export function useSetMessageRead() {
  const apply = useApplyMessageUpdate();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      adminMessagesApi.setRead(id, isRead),
    onSuccess: apply,
  });
}

export function useSetMessageStatus() {
  const apply = useApplyMessageUpdate();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: MessageStatus }) =>
      adminMessagesApi.setStatus(id, status),
    onSuccess: apply,
  });
}

export function useArchiveMessage() {
  const apply = useApplyMessageUpdate();
  return useMutation({
    mutationFn: (id: number) => adminMessagesApi.archive(id),
    onSuccess: apply,
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminMessagesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY_PREFIX });
    },
  });
}

export function useReplyToMessage() {
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ReplyInput }) =>
      adminMessagesApi.reply(id, input),
  });
}
