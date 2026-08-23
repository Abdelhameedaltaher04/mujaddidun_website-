import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, Bot, Loader2, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useChat } from '@/hooks/useChat';
import { CHAT_MAX_CONTENT_LENGTH } from '@/services/chat';
import { cn } from '@/lib/utils';

/**
 * Questions offered on the empty state.
 *
 * Every one of these is verified to produce a grounded answer against the
 * current published corpus — they are the four paths a visitor actually
 * arrives with. Four is deliberate: enough to show the assistant's range in one
 * glance, few enough not to read as a menu.
 *
 * The wording lives in the locale files, so each language asks the question the
 * way that language's visitors would.
 */
const SUGGESTION_KEYS = ['donate', 'volunteer', 'programs', 'contact'] as const;

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
  /**
   * Whether the thread is scrolled to (or near) the newest message.
   *
   * Starts true so a freshly opened panel lands at the bottom, and only turns
   * false when the visitor scrolls up themselves.
   */
  const [isPinnedToLatest, setIsPinnedToLatest] = useState(true);
  /** Below the `sm` breakpoint, where the panel is effectively full-screen. */
  const [isCompact, setIsCompact] = useState(false);

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

  const scrollToLatest = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  }, []);

  /** Recomputed on every scroll, so the pin follows what the visitor does. */
  const onMessagesScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Anything within this many pixels of the end counts as "at the bottom".
    setIsPinnedToLatest(el.scrollHeight - el.scrollTop - el.clientHeight <= 48);
  }, []);

  /**
   * Follow the newest message only while the visitor is already at the bottom.
   *
   * Forcing the scroll unconditionally yanked anyone re-reading an earlier
   * answer back down the moment a reply landed. When they have scrolled up the
   * thread is left where they put it, and the jump button offers the way back.
   */
  useLayoutEffect(() => {
    if (!isMounted || !isPinnedToLatest) return;
    scrollToLatest(true);
  }, [messages, isSending, errorKey, isMounted, isPinnedToLatest, scrollToLatest]);

  // Opening always starts at the newest message.
  useEffect(() => {
    if (isVisible) setIsPinnedToLatest(true);
  }, [isVisible]);

  // Track the breakpoint rather than assuming it, so a rotation or a resize
  // while the panel is open keeps the scroll lock in step with the layout.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  /**
   * Hold the page still behind the panel on small screens.
   *
   * There the panel covers most of the viewport, so scrolling the page behind
   * it is disorienting: the content moves but nothing the visitor can see
   * reacts. Desktop is left alone, where the panel is a small corner surface
   * and the page around it stays legitimately usable.
   *
   * The previous inline values are restored rather than blanked, and any
   * scrollbar width is padded back so removing it cannot shift the layout.
   */
  useEffect(() => {
    if (!open || !isCompact) return;

    const { body, documentElement: root } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousPaddingInlineEnd = body.style.paddingInlineEnd;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    // Both elements are locked on purpose: which one actually scrolls the page
    // differs between engines, and locking only <body> leaves the document
    // still scrolling wherever <html> is the scrolling element.
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      body.style.paddingInlineEnd = previousPaddingInlineEnd;
    };
  }, [open, isCompact]);

  useEffect(() => {
    if (isVisible) inputRef.current?.focus();
  }, [isVisible]);

  /**
   * Close and hand focus back to the launcher.
   *
   * The panel is portalled and unmounts on close, so any focus inside it would
   * otherwise fall to <body> — leaving a keyboard or screen-reader user with no
   * position on the page and nothing to tab from. The launcher is the control
   * that opened the panel and is always present, so it is where focus belongs
   * on every close path.
   */
  const close = useCallback((afterOutsidePress = false) => {
    onOpenChange(false);

    if (!afterOutsidePress) {
      launcherRef.current?.focus();
      return;
    }

    // An outside press is different: this runs on `pointerdown`, before the
    // browser has done its own focus handling, so focusing the launcher now
    // would just be overwritten a moment later — by the pressed control, or by
    // <body> when nothing focusable was pressed.
    //
    // One frame is enough to let that settle, and focus is then rescued only
    // when it landed nowhere. A link or field the visitor deliberately pressed
    // keeps focus, which is the whole point of a light dismiss.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) {
        launcherRef.current?.focus();
      }
    });
  }, [onOpenChange]);

  // Escape closes and returns focus to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

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
      close(true);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  /**
   * Keep Tab inside the panel while it is genuinely modal.
   *
   * This exists only because `aria-modal` is true on small screens. That
   * attribute tells assistive tech the rest of the page is inert, so letting
   * Tab walk out into content a screen reader has been told to ignore would
   * strand the visitor somewhere they cannot perceive. On desktop the panel is
   * a small corner surface, `aria-modal` is false, and no trap is installed —
   * tabbing away to the page is correct there.
   *
   * Only the two boundaries are intercepted, so ordinary Tab and Shift+Tab
   * between the panel's own controls behave exactly as the browser intends.
   * Escape is untouched and still closes.
   */
  useEffect(() => {
    if (!open || !isCompact) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);

      if (event.shiftKey ? active === first || outside : active === last || outside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, isCompact]);

  const autoGrow = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  /**
   * Start a new conversation.
   *
   * `reset()` clears the thread; the composer is this component's own state and
   * is cleared here, so a half-typed question from the previous conversation
   * does not survive into the new one. The textarea is auto-resizing, so its
   * inline height is recomputed rather than left at the old draft's size.
   *
   * Focus is moved deliberately: the reset control unmounts with the last
   * message, so without this it would fall to <body>. It is only taken when the
   * panel is actually open, so a reset triggered from anywhere else cannot pull
   * focus out from under the visitor.
   */
  const startNewConversation = useCallback(() => {
    reset();
    setDraft('');
    if (open) inputRef.current?.focus();
    requestAnimationFrame(autoGrow);
  }, [reset, open, autoGrow]);

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

  /**
   * The single string a screen reader hears when something changes.
   *
   * The message list itself is deliberately not a live region: it holds the
   * whole conversation, so every send re-announced everything already said.
   * Only the newest assistant turn — or the fact that one is being prepared —
   * belongs here. Errors are left out on purpose: the error block is already a
   * `role="alert"` and would otherwise be read twice.
   */
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const announcement = isSending ? t('chat.typing') : (lastAssistantMessage?.content ?? '');

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
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/25 border border-white/25 transition-all duration-300 hover:scale-110 hover:border-white/40 hover:shadow-xl hover:shadow-black/30 active:scale-95 focus-ring-standard motion-reduce:transition-none motion-reduce:hover:scale-100"
        data-testid="button-chat-open"
      >
        <MessageCircle
          className={cn(
            'absolute h-7 w-7 transition-all duration-200',
            open ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
          )}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
        />
        <X
          className={cn(
            'absolute h-6 w-6 transition-all duration-200',
            open ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        {/* Availability dot. Paired with text in the header, so colour is
            never the only signal. */}
        <span
          className={cn(
            'absolute -top-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-card transition-opacity duration-200',
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
            aria-modal={isCompact}
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
                  onClick={startNewConversation}
                  aria-label={t('chat.reset')}
                  className="rounded-lg p-2 transition-colors hover:bg-white/15 focus-ring-standard"
                  data-testid="button-chat-reset"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => close()}
                aria-label={t('chat.close')}
                className="rounded-lg p-2 transition-colors hover:bg-white/15 focus-ring-standard"
                data-testid="button-chat-close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            {/* Messages */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={scrollRef}
                onScroll={onMessagesScroll}
                className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden bg-muted/20 p-4"
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

                    {/* Suggested questions. Each sends exactly as if the visitor
                        had typed it, so there is no second message path to keep
                        in step with the composer. */}
                    <div
                      role="group"
                      aria-label={t('chat.suggestionsLabel')}
                      className="flex flex-wrap justify-center gap-2 pt-1"
                      data-testid="chat-suggestions"
                    >
                      {SUGGESTION_KEYS.map((key) => {
                        const suggestion = t(`chat.suggestions.${key}`);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => send(suggestion)}
                            disabled={isSending}
                            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 focus-ring-standard"
                            data-testid={`button-chat-suggestion-${key}`}
                          >
                            {suggestion}
                          </button>
                        );
                      })}
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
                        {/* Sighted readers get the speaker from the side the
                            bubble sits on and its colour; a screen reader gets
                            neither, so the name is spelled out for it alone. */}
                        <span className="sr-only">
                          {isUser ? t('chat.speakerYou') : t('chat.speakerAssistant')}:{' '}
                        </span>
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

              {/*
                Return to the newest message.

                Shown only while the visitor has scrolled away from the end, so
                it never covers the thread during ordinary reading. It sits
                inside the message area rather than the composer so it reads as
                part of the transcript it controls.
              */}
              {!isPinnedToLatest && messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPinnedToLatest(true);
                    scrollToLatest(true);
                  }}
                  aria-label={t('chat.jumpToLatest')}
                  className="absolute bottom-3 end-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-primary/5 focus-ring-standard"
                  data-testid="button-chat-jump-latest"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/*
              The only live region in the panel.

              It carries one string at a time — the newest assistant reply, or
              the fact that one is on its way — so a send never re-announces the
              conversation that came before it.
            */}
            <div className="sr-only" role="status" aria-live="polite">
              {announcement}
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
                  // Deliberately not disabled while a reply is in flight: the
                  // visitor can keep composing their next question. Nothing can
                  // be sent twice — `submit()` and `useChat.send()` both refuse
                  // while a request is pending, and the send button is disabled
                  // for the duration — so the only thing disabling this bought
                  // was taking the keyboard away mid-thought.
                  className="max-h-[120px] min-h-[2.25rem] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                  data-testid="input-chat-message"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={submit}
                  className="h-9 w-9 shrink-0 rounded-xl transition-transform active:scale-95 disabled:opacity-40 focus-ring-standard motion-reduce:transition-none"
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
