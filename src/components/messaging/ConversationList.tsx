'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

interface Conversation {
  id: string;
  athleteId: string;
  athleteName: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      if (loading) setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchConversations, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchConversations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchConversations]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Failed to load messages"
        description={error}
        action={
          <button
            onClick={() => {
              setLoading(true);
              fetchConversations();
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Start a conversation by visiting an athlete's profile and clicking the Message button."
        action={
          <Link
            href="/athletes"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Athletes
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.athleteId}`}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border transition-colors',
            conversation.unreadCount > 0
              ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
              : 'border-border hover:bg-muted/50'
          )}
        >
          {/* Avatar */}
          <div className={cn(
            'flex items-center justify-center h-10 w-10 rounded-full shrink-0 text-sm font-semibold',
            conversation.unreadCount > 0
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground'
          )}>
            {getInitials(conversation.athleteName)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                'text-sm truncate',
                conversation.unreadCount > 0 ? 'font-semibold' : 'font-medium'
              )}>
                {conversation.athleteName}
              </span>
              {conversation.lastMessageAt && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTimestamp(conversation.lastMessageAt)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={cn(
                'text-sm truncate',
                conversation.unreadCount > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}>
                {conversation.lastMessagePreview || 'No messages yet'}
              </p>
              {conversation.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
