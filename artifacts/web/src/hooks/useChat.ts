import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  chatApi,
  chatErrorCode,
  CHAT_MAX_MESSAGES,
  type ChatMessage,
} from '@/services/chat';

/**
 * Holds one browser-session conversation and sends it to the assistant.
 *
 * Nothing is persisted: closing the tab clears the thread, which matches the
 * stateless backend and means no visitor message is stored anywhere.
 */
export function useChat() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** i18n key suffix for the last failure, or null. */
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (history: ChatMessage[]) =>
      chatApi.send(history, locale === 'en' ? 'en' : 'ar'),
  });

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || mutation.isPending) return;

      setErrorKey(null);

      // Keep the newest turns and stay inside the backend's cap. The oldest
      // messages are dropped rather than letting the request 422.
      const history = [...messages, { role: 'user' as const, content }].slice(
        -CHAT_MAX_MESSAGES,
      );
      setMessages(history);

      mutation.mutate(history, {
        onSuccess: (reply) => {
          setMessages((current) => [...current, { role: 'assistant', content: reply }]);
        },
        onError: (error) => {
          const apiError = getApiError(error);
          const code = chatErrorCode(apiError.fields);
          setErrorKey(
            code ??
              (apiError.status === 429
                ? 'rateLimited'
                : apiError.status
                  ? 'generic'
                  : // No status means the request never reached the server.
                    'network'),
          );
        },
      });
    },
    [messages, mutation],
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setErrorKey(null);
    mutation.mutate(messages, {
      onSuccess: (reply) => {
        setMessages((current) => [...current, { role: 'assistant', content: reply }]);
      },
      onError: (error) => {
        const apiError = getApiError(error);
        setErrorKey(chatErrorCode(apiError.fields) ?? (apiError.status ? 'generic' : 'network'));
      },
    });
  }, [messages, mutation]);

  const reset = useCallback(() => {
    setMessages([]);
    setErrorKey(null);
  }, []);

  return {
    messages,
    send,
    retryLast,
    reset,
    isSending: mutation.isPending,
    errorKey,
  };
}
