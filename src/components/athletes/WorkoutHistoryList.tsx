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
  Dumbbell,
  Loader2,
  History,
  Timer,
  Target,
  TrendingUp,
  Minus,
} from 'lucide-react';

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

interface PrescribedData {
  sets: string | null;
  reps: string | null;
  load: string | null;
  rpe: number | null;
  rir: number | null;
  velocityTarget: number | null;
  percentageOf1RM: number | null;
  prescriptionType: string;
}

interface SessionDetail {
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
  totalPrescribedVolume: number;
  totalActualVolume: number;
  exercises: Array<{
    id: string;
    name: string;
    category: string | null;
    prescribed: PrescribedData;
    sets: Array<{
      id: string;
      setNumber: number;
      reps: number;
      weight: number;
      unit: string;
      rpe: number | null;
      velocity: number | null;
    }>;
    totalVolume: number;
  }>;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${Math.round(volume)} kg`;
}

function formatWeight(weight: number): string {
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(1);
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

function formatPrescription(p: PrescribedData): string {
  const parts: string[] = [];
  if (p.sets) parts.push(`${p.sets}×${p.reps || '?'}`);
  else if (p.reps) parts.push(`${p.reps} reps`);

  if (p.load && parseFloat(p.load) > 0) parts.push(`@ ${p.load}`);
  if (p.percentageOf1RM) parts.push(`${p.percentageOf1RM}%`);
  if (p.rpe) parts.push(`RPE ${p.rpe}`);
  if (p.rir !== null && p.rir !== undefined) parts.push(`RIR ${p.rir}`);
  if (p.velocityTarget) parts.push(`${p.velocityTarget} m/s`);

  return parts.length > 0 ? parts.join(' ') : 'No prescription';
}

type CompletionStatus = 'met' | 'partial' | 'missed';

function getExerciseStatus(
  prescribed: PrescribedData,
  actualSets: SessionDetail['exercises'][number]['sets']
): CompletionStatus {
  if (actualSets.length === 0) return 'missed';

  const prescribedSetsNum = parseInt(prescribed.sets || '0', 10) || 0;
  const prescribedRepsNum = parseInt(prescribed.reps || '0', 10) || 0;

  // If no prescription data, consider it met if any sets were logged
  if (prescribedSetsNum === 0 && prescribedRepsNum === 0) {
    return actualSets.length > 0 ? 'met' : 'missed';
  }

  const completedSets = actualSets.length;
  const allRepsMet = actualSets.every((s) => s.reps >= prescribedRepsNum);

  if (completedSets >= prescribedSetsNum && allRepsMet) return 'met';
  if (completedSets > 0) return 'partial';
  return 'missed';
}

const STATUS_STYLES: Record<CompletionStatus, { border: string; bg: string; icon: typeof CheckCircle2 }> = {
  met: { border: 'border-l-green-500', bg: 'bg-green-500/5', icon: CheckCircle2 },
  partial: { border: 'border-l-amber-500', bg: 'bg-amber-500/5', icon: TrendingUp },
  missed: { border: 'border-l-red-500', bg: 'bg-red-500/5', icon: Minus },
};

export function WorkoutHistoryList({ athleteId }: { athleteId: string }) {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SessionDetail>>({});
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

                {/* Expanded detail with prescribed vs actual */}
                {isExpanded && (
                  <div className="ml-4 mt-1 mb-2 space-y-1.5">
                    {isLoadingThis && !detail && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {detail && detail.exercises.length > 0 && (
                      <div className="space-y-1.5">
                        {detail.exercises.map((ex) => {
                          const status = getExerciseStatus(ex.prescribed, ex.sets);
                          const styles = STATUS_STYLES[status];
                          const StatusIcon = styles.icon;

                          return (
                            <div
                              key={ex.id}
                              className={cn(
                                'rounded-lg border border-l-4 p-3',
                                styles.border,
                                styles.bg
                              )}
                            >
                              {/* Exercise header */}
                              <div className="flex items-center gap-2 mb-2">
                                <StatusIcon className={cn(
                                  'h-3.5 w-3.5 shrink-0',
                                  status === 'met' && 'text-green-600',
                                  status === 'partial' && 'text-amber-600',
                                  status === 'missed' && 'text-red-500'
                                )} />
                                <span className="text-sm font-medium truncate">
                                  {ex.name}
                                </span>
                                {ex.totalVolume > 0 && (
                                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                    {formatVolume(ex.totalVolume)}
                                  </span>
                                )}
                              </div>

                              {/* Prescribed row */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                <Target className="h-3 w-3 shrink-0" />
                                <span className="font-medium">Rx:</span>
                                <span>{formatPrescription(ex.prescribed)}</span>
                              </div>

                              {/* Actual sets */}
                              {ex.sets.length > 0 ? (
                                <div className="space-y-0.5 ml-4">
                                  {ex.sets.map((set) => (
                                    <div
                                      key={set.id}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <span className="text-muted-foreground w-5 text-right shrink-0">
                                        {set.setNumber}
                                      </span>
                                      <span className="font-medium">
                                        {set.weight > 0
                                          ? `${formatWeight(set.weight)} ${set.unit}`
                                          : 'BW'}
                                        {' x '}
                                        {set.reps}
                                      </span>
                                      {set.rpe != null && (
                                        <span className="text-muted-foreground">
                                          @{set.rpe}
                                        </span>
                                      )}
                                      {set.velocity != null && (
                                        <span className="text-muted-foreground">
                                          {set.velocity.toFixed(2)} m/s
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-red-500/80 ml-4">
                                  No sets logged
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {/* Volume comparison summary */}
                        {(detail.totalPrescribedVolume > 0 || detail.totalActualVolume > 0) && (
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-center justify-between text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground w-20">Prescribed:</span>
                                  <span className="font-medium tabular-nums">
                                    {detail.totalPrescribedVolume > 0
                                      ? formatVolume(detail.totalPrescribedVolume)
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground w-20">Actual:</span>
                                  <span className="font-medium tabular-nums">
                                    {detail.totalActualVolume > 0
                                      ? formatVolume(detail.totalActualVolume)
                                      : '—'}
                                  </span>
                                </div>
                              </div>
                              {detail.totalPrescribedVolume > 0 && detail.totalActualVolume > 0 && (
                                <div className="text-right">
                                  {(() => {
                                    const pct = Math.round(
                                      (detail.totalActualVolume / detail.totalPrescribedVolume) * 100
                                    );
                                    return (
                                      <span className={cn(
                                        'text-sm font-bold tabular-nums',
                                        pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500'
                                      )}>
                                        {pct}%
                                      </span>
                                    );
                                  })()}
                                  <p className="text-muted-foreground mt-0.5">volume</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detail && detail.exercises.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        No exercise data available
                      </p>
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
