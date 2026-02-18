'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Ban,
  Filter,
  Move,
  X,
  SkipForward,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SessionData {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string | null;
  status: 'NOT_STARTED' | 'PARTIALLY_COMPLETED' | 'FULLY_COMPLETED';
  isSkipped: boolean;
  completionPercentage: number;
  weekNumber: number | null;
  dayNumber: number | null;
}

interface AthleteWithSessions {
  id: string;
  name: string;
  sessions: SessionData[];
}

interface WeeklyCalendarProps {
  athletes: AthleteWithSessions[];
  weekStart: string; // ISO date string for Monday of the displayed week
  isCurrentWeek: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(mondayStr + 'T00:00:00');
  sunday.setDate(sunday.getDate() + 6);

  const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const sameMonth = monday.getMonth() === sunday.getMonth();

  if (sameMonth) {
    return `${monthFmt.format(monday)} ${monday.getDate()} - ${sunday.getDate()}, ${monday.getFullYear()}`;
  }
  return `${monthFmt.format(monday)} ${monday.getDate()} - ${monthFmt.format(sunday)} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

function StatusIcon({ status, isSkipped }: { status: SessionData['status']; isSkipped: boolean }) {
  if (isSkipped) {
    return <Ban className="h-3 w-3 text-muted-foreground" />;
  }
  switch (status) {
    case 'FULLY_COMPLETED':
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case 'PARTIALLY_COMPLETED':
      return <Clock className="h-3 w-3 text-amber-500" />;
    case 'NOT_STARTED':
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />;
  }
}

interface MoveState {
  sessionId: string;
  athleteId: string;
  currentDate: string;
  title: string | null;
}

export function WeeklyCalendar({ athletes, weekStart, isCurrentWeek }: WeeklyCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterAthleteId, setFilterAthleteId] = useState<string>(
    searchParams.get('athleteId') || 'all'
  );
  const [moveState, setMoveState] = useState<MoveState | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [skippingSessionId, setSkippingSessionId] = useState<string | null>(null);

  // Generate the 7 dates (Mon-Sun) for this week
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Today's date for highlighting
  const today = new Date().toISOString().split('T')[0];

  // Filter athletes
  const displayedAthletes = useMemo(() => {
    if (filterAthleteId === 'all') return athletes;
    return athletes.filter((a) => a.id === filterAthleteId);
  }, [athletes, filterAthleteId]);

  // Build a lookup: athleteId -> dateStr -> session
  const sessionMap = useMemo(() => {
    const map = new Map<string, Map<string, SessionData>>();
    for (const athlete of athletes) {
      const dateMap = new Map<string, SessionData>();
      for (const session of athlete.sessions) {
        dateMap.set(session.date, session);
      }
      map.set(athlete.id, dateMap);
    }
    return map;
  }, [athletes]);

  function navigateWeek(direction: 'prev' | 'next') {
    const offset = direction === 'prev' ? -7 : 7;
    const newWeekStart = addDays(weekStart, offset);
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', newWeekStart);
    router.push(`/schedule?${params.toString()}`);
  }

  function goToCurrentWeek() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('week');
    router.push(`/schedule?${params.toString()}`);
  }

  function handleAthleteFilter(athleteId: string) {
    setFilterAthleteId(athleteId);
    const params = new URLSearchParams(searchParams.toString());
    if (athleteId === 'all') {
      params.delete('athleteId');
    } else {
      params.set('athleteId', athleteId);
    }
    router.push(`/schedule?${params.toString()}`);
  }

  // Start a move operation: select a session to move
  const handleStartMove = useCallback((session: SessionData, athleteId: string) => {
    if (session.status !== 'NOT_STARTED' || session.isSkipped) return;
    setMoveState({
      sessionId: session.id,
      athleteId,
      currentDate: session.date,
      title: session.title,
    });
  }, []);

  // Cancel the move
  const handleCancelMove = useCallback(() => {
    setMoveState(null);
  }, []);

  // Execute the move: drop session on target date
  const handleExecuteMove = useCallback(async (targetDate: string) => {
    if (!moveState) return;
    if (targetDate === moveState.currentDate) {
      setMoveState(null);
      return;
    }

    setIsMoving(true);
    try {
      const res = await fetch(`/api/schedule/${moveState.sessionId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: targetDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to move workout');
        return;
      }

      // Refresh the page data
      router.refresh();
    } catch {
      alert('Failed to move workout');
    } finally {
      setMoveState(null);
      setIsMoving(false);
    }
  }, [moveState, router]);

  // Skip or unskip a session
  const handleToggleSkip = useCallback(async (sessionId: string, currentlySkipped: boolean) => {
    setSkippingSessionId(sessionId);
    try {
      const res = await fetch(`/api/schedule/${sessionId}/skip`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: !currentlySkipped }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update skip status');
        return;
      }

      router.refresh();
    } catch {
      alert('Failed to update skip status');
    } finally {
      setSkippingSessionId(null);
    }
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Move mode banner */}
      {moveState && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
          <Move className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-blue-800 dark:text-blue-200">
            Moving <strong>{moveState.title || 'Workout'}</strong> &mdash; click a cell in the same row to move it there{isMoving ? ' ...' : ', or'}
          </span>
          {!isMoving && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelMove}
              className="ml-auto text-blue-700 hover:text-blue-900"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Week navigation + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('prev')}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('next')}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {formatWeekRange(weekStart)}
          </h2>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
          )}
        </div>

        {/* Athlete filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterAthleteId}
            onChange={(e) => handleAthleteFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Athletes ({athletes.length})</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 z-10 bg-background px-4 py-3 text-left text-sm font-medium text-muted-foreground w-40">
                    Athlete
                  </th>
                  {weekDates.map((date, i) => {
                    const isToday = date === today;
                    const dayDate = new Date(date + 'T00:00:00');
                    return (
                      <th
                        key={date}
                        className={cn(
                          'px-2 py-3 text-center text-sm font-medium min-w-[100px]',
                          isToday
                            ? 'bg-primary/5 text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        <div>{DAY_LABELS[i]}</div>
                        <div className={cn('text-xs', isToday ? 'font-bold' : 'font-normal')}>
                          {dayDate.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayedAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No athletes to display.
                    </td>
                  </tr>
                ) : (
                  displayedAthletes.map((athlete) => {
                    const athleteSessions = sessionMap.get(athlete.id);
                    const isMovingThisAthlete = moveState?.athleteId === athlete.id;

                    return (
                      <tr key={athlete.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-background px-4 py-3">
                          <Link
                            href={`/athletes/${athlete.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {athlete.name}
                          </Link>
                        </td>
                        {weekDates.map((date) => {
                          const session = athleteSessions?.get(date);
                          const isToday = date === today;
                          const isSelectedForMove = moveState?.sessionId === session?.id;
                          const isMoveTarget = isMovingThisAthlete && !isSelectedForMove;
                          const canSwap = isMoveTarget && session?.status === 'NOT_STARTED' && !session?.isSkipped;
                          const canDropEmpty = isMoveTarget && !session;

                          return (
                            <td
                              key={date}
                              className={cn(
                                'px-2 py-2 text-center align-top',
                                isToday && 'bg-primary/5',
                                isSelectedForMove && 'bg-blue-100 dark:bg-blue-900/30',
                                (canSwap || canDropEmpty) && 'cursor-pointer'
                              )}
                              onClick={
                                canDropEmpty || canSwap
                                  ? () => handleExecuteMove(date)
                                  : undefined
                              }
                            >
                              {session ? (
                                <SessionCell
                                  session={session}
                                  athleteId={athlete.id}
                                  isSelected={isSelectedForMove}
                                  isMoveTarget={canSwap}
                                  isMoving={isMoving}
                                  onStartMove={handleStartMove}
                                  onToggleSkip={handleToggleSkip}
                                  isSkipping={skippingSessionId === session.id}
                                  moveActive={!!moveState}
                                />
                              ) : (canDropEmpty) ? (
                                <div className={cn(
                                  'py-2 rounded-md border-2 border-dashed border-blue-300 text-xs text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30',
                                  isMoving && 'pointer-events-none opacity-50'
                                )}>
                                  Move here
                                </div>
                              ) : (
                                <div className="py-2 text-xs text-muted-foreground/50">
                                  &mdash;
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" /> Not Started
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <Ban className="h-3 w-3" /> Skipped
        </span>
        <span className="flex items-center gap-1">
          <Move className="h-3 w-3" /> Click a workout to move it
        </span>
      </div>
    </div>
  );
}

interface SessionCellProps {
  session: SessionData;
  athleteId: string;
  isSelected: boolean;
  isMoveTarget: boolean;
  isMoving: boolean;
  onStartMove: (session: SessionData, athleteId: string) => void;
  onToggleSkip: (sessionId: string, currentlySkipped: boolean) => void;
  isSkipping: boolean;
  moveActive: boolean;
}

function SessionCell({
  session,
  athleteId,
  isSelected,
  isMoveTarget,
  isMoving,
  onStartMove,
  onToggleSkip,
  isSkipping,
  moveActive,
}: SessionCellProps) {
  const statusColors = {
    NOT_STARTED: 'border-border bg-muted/30',
    PARTIALLY_COMPLETED: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
    FULLY_COMPLETED: 'border-green-300 bg-green-50 dark:bg-green-950/20',
  };

  const bgClass = session.isSkipped
    ? 'border-border bg-muted/20 opacity-60'
    : statusColors[session.status];

  const canMove = session.status === 'NOT_STARTED' && !session.isSkipped;

  // When a move is active and this is a valid swap target, make it clickable
  if (isMoveTarget) {
    return (
      <div
        className={cn(
          'rounded-md border-2 border-dashed p-1.5 text-left transition-colors',
          canMove
            ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : bgClass,
          isMoving && 'pointer-events-none opacity-50'
        )}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <StatusIcon status={session.status} isSkipped={session.isSkipped} />
          {canMove && <span className="text-[10px] text-blue-600 font-medium">Swap</span>}
        </div>
        <p className={cn(
          'text-xs font-medium truncate',
          session.isSkipped && 'line-through'
        )}>
          {session.title || 'Workout'}
        </p>
      </div>
    );
  }

  // When this session is selected for moving
  if (isSelected) {
    return (
      <div
        className="rounded-md border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/40 p-1.5 text-left ring-2 ring-blue-300"
      >
        <div className="flex items-center gap-1 mb-0.5">
          <Move className="h-3 w-3 text-blue-600" />
          <span className="text-[10px] text-blue-600 font-medium">Moving...</span>
        </div>
        <p className="text-xs font-medium truncate text-blue-800 dark:text-blue-200">
          {session.title || 'Workout'}
        </p>
      </div>
    );
  }

  // Normal state: clickable link, but NOT_STARTED sessions also show action buttons
  const actionButtons = !moveActive && session.status === 'NOT_STARTED' && (
    <span className="ml-auto flex items-center gap-0.5">
      {session.isSkipped ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSkip(session.id, session.isSkipped);
          }}
          disabled={isSkipping}
          className="p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
          title="Unskip this workout"
        >
          <Undo2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      ) : (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSkip(session.id, session.isSkipped);
            }}
            disabled={isSkipping}
            className="p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
            title="Skip this workout"
          >
            <SkipForward className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartMove(session, athleteId);
            }}
            className="p-0.5 rounded hover:bg-muted transition-colors"
            title="Move this workout"
          >
            <Move className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </>
      )}
    </span>
  );

  const content = (
    <>
      <div className="flex items-center gap-1 mb-0.5">
        <StatusIcon status={session.status} isSkipped={session.isSkipped} />
        {session.status === 'FULLY_COMPLETED' && !session.isSkipped && (
          <span className="text-[10px] text-green-600 font-medium">
            {Math.round(session.completionPercentage)}%
          </span>
        )}
        {session.status === 'PARTIALLY_COMPLETED' && !session.isSkipped && (
          <span className="text-[10px] text-amber-600 font-medium">
            {Math.round(session.completionPercentage)}%
          </span>
        )}
        {actionButtons}
      </div>
      <p className={cn(
        'text-xs font-medium truncate',
        session.isSkipped && 'line-through'
      )}>
        {session.title || 'Workout'}
      </p>
      {session.weekNumber != null && session.dayNumber != null && (
        <p className="text-[10px] text-muted-foreground">
          W{session.weekNumber}D{session.dayNumber}
        </p>
      )}
    </>
  );

  return (
    <Link
      href={`/athletes/${athleteId}`}
      className={cn(
        'block rounded-md border p-1.5 text-left transition-colors hover:shadow-sm',
        bgClass
      )}
    >
      {content}
    </Link>
  );
}
