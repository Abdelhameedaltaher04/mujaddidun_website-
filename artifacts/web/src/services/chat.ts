/**
 * Public support assistant — Laravel endpoint:
 *   POST /public/chat   (no auth, rate limited)
 *
 * The conversation is stateless: the whole history is sent on every request and
 * nothing is stored server-side. The Anthropic key lives only on the backend —
 * this module never sees it.
 */
import { apiClient, type ApiEnvelope } from './api';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Mirrors the caps enforced by SendChatMessageRequest on the backend. */
export const CHAT_MAX_MESSAGES = 21;
export const CHAT_MAX_CONTENT_LENGTH = 2000;

interface ChatReplyPayload {
  reply: string;
}

export const chatApi = {
  /** POST /public/chat */
  async send(messages: ChatMessage[], locale: 'ar' | 'en'): Promise<string> {
    const response = await apiClient.post<ApiEnvelope<ChatReplyPayload>>(
      '/public/chat',
      { messages, locale },
    );
    return response.data.data.reply;
  },
};

/** Reason codes the backend can return, mapped to i18n keys by the caller. */
export const CHAT_ERROR_CODES = [
  'ai_not_configured',
  'ai_unavailable',
  'ai_declined',
  'ai_empty_response',
  'empty_conversation',
] as const;

export type ChatErrorCode = (typeof CHAT_ERROR_CODES)[number];

export function chatErrorCode(fields: Record<string, string>): ChatErrorCode | null {
  const code = fields.code;
  return CHAT_ERROR_CODES.includes(code as ChatErrorCode)
    ? (code as ChatErrorCode)
    : null;
}
