import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Bot, Loader2, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useChat } from '@/hooks/useChat';
import { CHAT_MAX_CONTENT_LENGTH } from '@/services/chat';
import { cn } from '@/lib/utils';

/**
 * Public support assistant.
 *
 * The launcher renders **in flow** so the floating stack in FloatingActions
 * owns its placement — there is no second fixed-positioning system here.
 *
 * The panel is portalled to document.body rather than rendered beside the
 * launcher. That stack fades and translates itself out of the way while the
 * panel is open, and as a DOM descendant the panel would inherit all of it:
 * `opacity-0` applies to descendants whatever their positioning, and an
 * ancestor `transform` becomes the containing block for `position: fixed`
 * children. The portal lifts the panel out of that subtree entirely.
 */
export function ChatWidget({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, dir } = useLocale();
  const { messages, send, retryLast, reset, isSending, errorKey } = useChat();
  const [draft, setDraft] = useState('');
  // Drives the enter/leave transition without keeping a hidden, focusable
  // panel in the DOM while closed.
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      // Next frame, so the element transitions from its closed state.
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setIsVisible(false);
    const timer = window.setTimeout(() => setIsMounted(false), 200);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Keep the newest message in view as the thread grows.
  useLayoutEffect(() => {
    if (!isMounted) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending, errorKey, isMounted]);

  useEffect(() => {
    if (isVisible) inputRef.current?.focus();
  }, [isVisible]);

  // Escape closes and returns focus to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  /**
   * Close when a press starts anywhere outside the panel.
   *
   * `pointerdown` rather than `click` so a text selection that begins inside
   * the panel and ends outside it does not count as an outside press, and so
   * one listener covers mouse, touch and pen.
   *
   * Two elements are explicitly not "outside":
   *  - the panel itself, which is portalled to document.body and therefore is
   *    not a DOM descendant of anything this component renders in flow;
   *  - the launcher, whose own handler owns the toggle. Without this, pressing
   *    it while open would close here and immediately reopen on click, leaving
   *    the panel stuck open.
   *
   * The listener only exists while the panel is open, and is removed on
   * cleanup and whenever `open` changes.
   */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (launcherRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  const autoGrow = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const submit = useCallback(() => {
    if (!draft.trim() || isSending) return;
    send(draft);
    setDraft('');
    requestAnimationFrame(autoGrow);
  }, [draft, isSending, send, autoGrow]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <>
      {/* Launcher — placed by the FloatingActions stack, not positioned here. */}
      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? t('chat.close') : t('chat.open')}
        aria-expanded={open}
        aria-controls="mujaddidun-chat-panel"
        onClick={() => onOpenChange(!open)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-white/15 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95 focus-ring-standard motion-reduce:transition-none motion-reduce:hover:scale-100"
        data-testid="button-chat-open"
      >
        <MessageCircle
          className={cn(
            'absolute h-6 w-6 transition-all duration-200',
            open ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
          )}
          aria-hidden="true"
        />
        <X
          className={cn(
            'absolute h-6 w-6 transition-all duration-200',
            open ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
          aria-hidden="true"
        />
        {/* Availability dot. Paired with text in the header, so colour is
            never the only signal. */}
        <span
          className={cn(
            'absolute -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-success transition-opacity duration-200',
            dir === 'rtl' ? '-start-0.5' : '-end-0.5',
            open && 'opacity-0',
          )}
          aria-hidden="true"
        />
      </button>

      {isMounted &&
        createPortal(
          <div
            ref={panelRef}
            id="mujaddidun-chat-panel"
            dir={dir}
            role="dialog"
            aria-modal="false"
            aria-label={t('chat.title')}
            className={cn(
              'fixed inset-x-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10',
              'max-h-[min(620px,calc(100dvh-1.5rem))]',
              'sm:inset-x-auto sm:bottom-6 sm:end-6 sm:w-[min(400px,calc(100vw-3rem))] sm:max-h-[min(620px,calc(100dvh-3rem))]',
              'origin-bottom transition-all duration-200 ease-out motion-reduce:transition-none',
              isVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-3 scale-[0.98] opacity-0',
            )}
            data-testid="chat-panel"
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-primary/20 bg-gradient-to-br from-primary to-primary/85 px-4 py-3.5 text-primary-foreground">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20"
                aria-hidden="true"
              >
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">{t('chat.title')}</p>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs opacity-90">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="truncate">{t('chat.online')}</span>
                </span>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label={t('chat.reset')}
                  className="rounded-lg p-2 transition-colors hover:bg-white/15 focus-ring-standard"
                  data-testid="button-chat-reset"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t('chat.close')}
                className="rounded-lg p-2 transition-colors hover:bg-white/15 focus-ring-standard"
                data-testid="button-chat-close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden bg-muted/20 p-4"
              aria-live="polite"
              aria-busy={isSending}
              data-testid="chat-messages"
            >
              {messages.length === 0 && !isSending && !errorKey ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center"
                  data-testid="chat-empty"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Bot className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">{t('chat.emptyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('chat.emptyIntro')}</p>
                    <p className="text-sm font-medium text-foreground">{t('chat.empty')}</p>
                  </div>
                </div>
              ) : null}

              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
                    data-testid={`chat-message-${message.role}`}
                  >
                    <p
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isUser
                          ? 'rounded-2xl rounded-ee-md bg-primary text-primary-foreground'
                          : 'rounded-2xl rounded-es-md border border-border bg-card text-foreground',
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start" data-testid="chat-typing">
                  <span className="flex items-center gap-2 rounded-2xl rounded-es-md border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {t('chat.typing')}
                  </span>
                </div>
              )}

              {errorKey && (
                <div
                  role="alert"
                  className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-3 text-center"
                  data-testid="chat-error"
                >
                  <p className="mb-2 text-sm text-muted-foreground">
                    {t(`chat.errors.${errorKey}`)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryLast}
                    data-testid="button-chat-retry"
                  >
                    {t('news.retry')}
                  </Button>
                </div>
              )}
            </div>

            {/* Composer — visually separated from the message area. */}
            <div className="border-t border-border bg-card p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-1.5 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    autoGrow();
                  }}
                  onKeyDown={onInputKeyDown}
                  maxLength={CHAT_MAX_CONTENT_LENGTH}
                  placeholder={t('chat.placeholder')}
                  aria-label={t('chat.placeholder')}
                  aria-describedby="mujaddidun-chat-hint"
                  disabled={isSending}
                  className="max-h-[120px] min-h-[2.25rem] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid="input-chat-message"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={submit}
                  className="h-9 w-9 shrink-0 rounded-xl transition-transform active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
                  disabled={!canSend}
                  aria-label={t('chat.send')}
                  data-testid="button-chat-send"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Send
                      className={cn('h-4 w-4', dir === 'rtl' && 'rotate-180')}
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </div>
              <p
                id="mujaddidun-chat-hint"
                className="mt-2 px-1 text-center text-[11px] leading-snug text-muted-foreground"
              >
                <span className="hidden sm:inline">{t('chat.hint')} · </span>
                {t('chat.disclaimer')}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
