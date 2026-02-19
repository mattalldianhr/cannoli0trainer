'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  Timer,
} from 'lucide-react';
import { WorkoutSessionDetail, type SessionDetailData } from './WorkoutSessionDetail';

interface HistorySession {
  id: string;
  date: string;
  title: string | null;
  status: string;
  completionPercentage: number;
  completedItems: number;
  totalItems: number;
  programName: string | null;
  weekNumber: number | null;
  dayNumber: number | null;
  durationSeconds: number | null;
  exerciseCount: number;
  totalVolume: number;
  totalSets: number;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${Math.round(volume)} kg`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function WorkoutHistoryList({ athleteId }: { athleteId: string }) {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SessionDetailData>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const fetchSessions = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/athletes/${athleteId}/history?page=${pageNum}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setSessions((prev) => [...prev, ...data.data]);
          } else {
            setSessions(data.data);
          }
          setHasMore(data.hasMore);
          setTotal(data.total);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [athleteId]
  );

  useEffect(() => {
    fetchSessions(1, false);
  }, [fetchSessions]);

  async function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchSessions(nextPage, true);
  }

  async function toggleExpand(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(sessionId);

    if (detailCache[sessionId]) return;

    setLoadingDetail(sessionId);
    try {
      const res = await fetch(
        `/api/athletes/${athleteId}/history?sessionId=${sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDetailCache((prev) => ({ ...prev, [sessionId]: data.session }));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDetail(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Training History</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Training History</h2>
          <div className="flex flex-col items-center py-8 text-center">
            <History className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No training sessions recorded yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Training History ({total} sessions)
          </h2>
        </div>

        <div className="space-y-2">
          {sessions.map((s) => {
            const isExpanded = expandedId === s.id;
            const detail = detailCache[s.id];
            const isLoadingThis = loadingDetail === s.id;
            const isCompleted = s.status === 'FULLY_COMPLETED';
            const pct = Math.round(s.completionPercentage);

            return (
              <div key={s.id}>
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer hover:bg-muted/50',
                    isExpanded && 'border-primary/30 bg-muted/30'
                  )}
                  onClick={() => toggleExpand(s.id)}
                >
                  {/* Status icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5',
                      isCompleted
                        ? 'bg-green-500/10 text-green-600'
                        : s.status === 'PARTIALLY_COMPLETED'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.title || 'Training Session'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(s.date)}
                          {s.programName && <> &middot; {s.programName}</>}
                          {s.weekNumber != null && s.dayNumber != null && (
                            <> &middot; W{s.weekNumber}D{s.dayNumber}</>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            pct >= 80 ? 'default' : pct >= 50 ? 'secondary' : 'outline'
                          }
                          className="text-xs tabular-nums"
                        >
                          {pct}%
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Summary stats */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{s.exerciseCount} exercises</span>
                      <span>{s.totalSets} sets</span>
                      {s.totalVolume > 0 && <span>{formatVolume(s.totalVolume)}</span>}
                      {s.durationSeconds != null && s.durationSeconds > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Timer className="h-3 w-3" />
                          {formatDuration(s.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded session detail with prescribed vs actual comparison */}
                {isExpanded && (
                  <div className="mt-2 mb-3 ml-2">
                    {isLoadingThis && !detail && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {detail && (
                      <WorkoutSessionDetail
                        session={detail}
                        mode="coach"
                        onNotesUpdated={(sessionId, updatedNotes) => {
                          setDetailCache((prev) => ({
                            ...prev,
                            [sessionId]: {
                              ...prev[sessionId],
                              coachNotes: updatedNotes,
                            },
                          }));
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
