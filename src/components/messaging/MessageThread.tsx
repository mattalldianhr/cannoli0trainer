'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Send, Loader2, ChevronUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

interface Message {
  id: string;
  senderId: string;
  senderType: 'COACH' | 'ATHLETE';
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface MessageThreadProps {
  /** 'coach' uses /api/messages/[athleteId], 'athlete' uses /api/athlete/messages */
  mode: 'coach' | 'athlete';
  /** Required for coach mode — the athlete to message */
  athleteId?: string;
}

const POLL_INTERVAL = 10000; // 10 seconds
const PAGE_SIZE = 50;

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (messageDay.getTime() === today.getTime()) return 'Today';
  if (messageDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Group messages by calendar day, returning groups in chronological order. */
function groupByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Map<string, Message[]> = new Map();
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(msg);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, msgs]) => ({ date, messages: msgs }));
}

export function MessageThread({ mode, athleteId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottom = useRef(true);
  const initialLoadDone = useRef(false);

  // Build the correct API URLs based on mode
  const getThreadUrl = useCallback(
    (params?: Record<string, string>) => {
      const base =
        mode === 'coach'
          ? `/api/messages/${athleteId}`
          : '/api/athlete/messages';
      if (!params) return base;
      const qs = new URLSearchParams(params).toString();
      return `${base}?${qs}`;
    },
    [mode, athleteId]
  );

  const getMarkReadUrl = useCallback(() => {
    return mode === 'coach'
      ? `/api/messages/${athleteId}/read`
      : '/api/athlete/messages/read';
  }, [mode, athleteId]);

  const getSendUrl = useCallback(() => {
    return mode === 'coach' ? '/api/messages' : '/api/athlete/messages';
  }, [mode]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track whether user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isAtBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Initial message fetch
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(getThreadUrl({ limit: String(PAGE_SIZE) }));
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages);
      setHasMore(data.hasMore);
      setError(null);
    } catch {
      if (!initialLoadDone.current) setError('Failed to load messages');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [getThreadUrl]);

  // Mark as read
  const markRead = useCallback(async () => {
    try {
      await fetch(getMarkReadUrl(), { method: 'PATCH' });
    } catch {
      // Silent fail — not critical
    }
  }, [getMarkReadUrl]);

  // Initial load + mark read
  useEffect(() => {
    fetchMessages();
    markRead();
  }, [fetchMessages, markRead]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Small delay to ensure DOM rendered
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [loading, messages.length === 0, scrollToBottom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new messages
  useEffect(() => {
    if (loading) return;

    const poll = async () => {
      if (messages.length === 0) {
        // No messages yet — do a full fetch
        await fetchMessages();
        return;
      }
      const lastId = messages[messages.length - 1]?.id;
      if (!lastId) return;

      try {
        const res = await fetch(getThreadUrl({ after: lastId }));
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages]);
          markRead();
          if (isAtBottom.current) {
            requestAnimationFrame(() => scrollToBottom('smooth'));
          }
        }
      } catch {
        // Silent poll failure
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        poll();
        markRead();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loading, messages, getThreadUrl, fetchMessages, markRead, scrollToBottom]);

  // Load older messages
  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);

    const scrollEl = scrollRef.current;
    const prevHeight = scrollEl?.scrollHeight ?? 0;

    try {
      const oldestId = messages[0].id;
      const res = await fetch(
        getThreadUrl({ cursor: oldestId, limit: String(PAGE_SIZE) })
      );
      if (!res.ok) throw new Error('Failed to load older messages');
      const data = await res.json();
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight;
        }
      });
    } catch {
      // Silent fail
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMore, messages, getThreadUrl]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        senderId: '',
        senderType: mode === 'coach' ? 'COACH' : 'ATHLETE',
        content: trimmed,
        createdAt: new Date().toISOString(),
        readAt: null,
      };

      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      setSending(true);
      requestAnimationFrame(() => scrollToBottom('smooth'));

      try {
        const body =
          mode === 'coach'
            ? { athleteId, content: trimmed }
            : { content: trimmed };

        const res = await fetch(getSendUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to send message');
        const sent = await res.json();

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? sent : m))
        );
      } catch {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(trimmed); // Restore input
        setError('Failed to send message. Please try again.');
        setTimeout(() => setError(null), 3000);
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [mode, athleteId, sending, getSendUrl, scrollToBottom]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (value: string) => {
    setInput(value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                'flex',
                i % 2 === 0 ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'animate-pulse rounded-2xl',
                  i % 2 === 0 ? 'bg-primary/20' : 'bg-muted',
                  i % 3 === 0 ? 'h-10 w-48' : 'h-8 w-36'
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isOwnMessage = (msg: Message) =>
    (mode === 'coach' && msg.senderType === 'COACH') ||
    (mode === 'athlete' && msg.senderType === 'ATHLETE');

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load older button */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-full transition-colors disabled:opacity-50"
            >
              {loadingOlder ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
              Load older messages
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Send a message to start the conversation."
            className="py-16"
          />
        )}

        {/* Message groups by date */}
        {grouped.map((group) => (
          <div key={group.date} className="space-y-2">
            {/* Date header */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full">
                {formatDateHeader(group.messages[0].createdAt)}
              </span>
            </div>

            {/* Messages */}
            {group.messages.map((msg, idx) => {
              const own = isOwnMessage(msg);
              const isTemp = msg.id.startsWith('temp-');
              // Collapse timestamps for consecutive same-sender messages within 2 minutes
              const prev = idx > 0 ? group.messages[idx - 1] : null;
              const showTime =
                !prev ||
                prev.senderType !== msg.senderType ||
                new Date(msg.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() >
                  120000;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    own ? 'justify-end' : 'justify-start',
                    !showTime && 'mt-0.5'
                  )}
                >
                  <div
                    className={cn('max-w-[75%] sm:max-w-[65%]', {
                      'opacity-60': isTemp,
                    })}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                        own
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {msg.content}
                    </div>
                    {showTime && (
                      <div
                        className={cn(
                          'text-[10px] text-muted-foreground mt-1 px-1',
                          own ? 'text-right' : 'text-left'
                        )}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 text-center">
          {error}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex items-end gap-2 bg-background"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
