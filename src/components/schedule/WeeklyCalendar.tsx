'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Ban,
  Filter,
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

export function WeeklyCalendar({ athletes, weekStart, isCurrentWeek }: WeeklyCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterAthleteId, setFilterAthleteId] = useState<string>(
    searchParams.get('athleteId') || 'all'
  );

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

  return (
    <div className="space-y-4">
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

                          return (
                            <td
                              key={date}
                              className={cn(
                                'px-2 py-2 text-center align-top',
                                isToday && 'bg-primary/5'
                              )}
                            >
                              {session ? (
                                <SessionCell session={session} athleteId={athlete.id} />
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
      </div>
    </div>
  );
}

function SessionCell({ session, athleteId }: { session: SessionData; athleteId: string }) {
  const statusColors = {
    NOT_STARTED: 'border-border bg-muted/30',
    PARTIALLY_COMPLETED: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
    FULLY_COMPLETED: 'border-green-300 bg-green-50 dark:bg-green-950/20',
  };

  const bgClass = session.isSkipped
    ? 'border-border bg-muted/20 opacity-60'
    : statusColors[session.status];

  return (
    <Link
      href={`/athletes/${athleteId}`}
      className={cn(
        'block rounded-md border p-1.5 text-left transition-colors hover:shadow-sm',
        bgClass
      )}
    >
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
    </Link>
  );
}
