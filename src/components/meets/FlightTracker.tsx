'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  generateWarmupSchedule,
  formatTime,
  formatCountdown,
  getSetStatus,
  DEFAULT_INTERVAL_MINUTES,
  type WarmupSchedule,
  type WarmupSet,
} from '@/components/meets/WarmupCalculator';

interface AthleteEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  plannedOpeners: {
    squat?: number;
    bench?: number;
    deadlift?: number;
  };
}

interface FlightTrackerProps {
  entries: AthleteEntry[];
}

type Lift = 'squat' | 'bench' | 'deadlift';

const LIFT_OPTIONS: { value: Lift; label: string }[] = [
  { value: 'squat', label: 'Squat' },
  { value: 'bench', label: 'Bench' },
  { value: 'deadlift', label: 'Deadlift' },
];

interface AthleteSchedule {
  entry: AthleteEntry;
  schedule: WarmupSchedule;
  completedSets: Set<number>;
}

export function FlightTracker({ entries }: FlightTrackerProps) {
  const [selectedLift, setSelectedLift] = useState<Lift>('squat');
  const [flightStartTimeStr, setFlightStartTimeStr] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(
    String(DEFAULT_INTERVAL_MINUTES)
  );
  const [athleteSchedules, setAthleteSchedules] = useState<AthleteSchedule[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [now, setNow] = useState(new Date());

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleGenerate = useCallback(() => {
    if (!flightStartTimeStr) return;

    const [hours, minutes] = flightStartTimeStr.split(':').map(Number);
    const flightStart = new Date();
    flightStart.setHours(hours, minutes, 0, 0);

    const interval = parseFloat(intervalMinutes) || DEFAULT_INTERVAL_MINUTES;
    const liftLabel =
      LIFT_OPTIONS.find((l) => l.value === selectedLift)?.label ?? selectedLift;

    const schedules: AthleteSchedule[] = entries
      .filter((entry) => {
        const opener = entry.plannedOpeners[selectedLift];
        return opener != null && opener > 0;
      })
      .map((entry) => ({
        entry,
        schedule: generateWarmupSchedule(
          liftLabel,
          entry.plannedOpeners[selectedLift]!,
          flightStart,
          interval
        ),
        completedSets: new Set<number>(),
      }));

    setAthleteSchedules(schedules);
    setIsTimerRunning(false);
    setNow(new Date());
  }, [flightStartTimeStr, intervalMinutes, selectedLift, entries]);

  const handleReset = () => {
    setAthleteSchedules([]);
    setIsTimerRunning(false);
  };

  const toggleSetComplete = (athleteIdx: number, setNumber: number) => {
    setAthleteSchedules((prev) =>
      prev.map((as, i) => {
        if (i !== athleteIdx) return as;
        const next = new Set(as.completedSets);
        if (next.has(setNumber)) {
          next.delete(setNumber);
        } else {
          next.add(setNumber);
        }
        return { ...as, completedSets: next };
      })
    );
  };

  // Athletes that have an opener for the selected lift
  const athletesWithOpener = entries.filter((e) => {
    const opener = e.plannedOpeners[selectedLift];
    return opener != null && opener > 0;
  });

  const isConfigured = athleteSchedules.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Flight Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration */}
        {!isConfigured && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lift</Label>
                <select
                  value={selectedLift}
                  onChange={(e) => setSelectedLift(e.target.value as Lift)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {LIFT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Flight Start
                </Label>
                <Input
                  type="time"
                  value={flightStartTimeStr}
                  onChange={(e) => setFlightStartTimeStr(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Min. between sets</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex items-end">
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!flightStartTimeStr || athletesWithOpener.length === 0}
                  className="w-full h-9"
                >
                  <Timer className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            </div>

            {athletesWithOpener.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No athletes have a planned {selectedLift} opener. Set openers in
                the attempt planning section above.
              </p>
            )}
            {athletesWithOpener.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {athletesWithOpener.length} athlete
                {athletesWithOpener.length !== 1 ? 's' : ''} with{' '}
                {selectedLift} openers:{' '}
                {athletesWithOpener.map((a) => a.athleteName).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Flight Tracking Grid */}
        {isConfigured && (
          <div className="space-y-4">
            {/* Header with controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm">
                <span className="font-medium capitalize">{selectedLift}</span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">
                  Flight at{' '}
                  {formatTime(athleteSchedules[0]?.schedule.flightStartTime)}
                </span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">
                  {athleteSchedules.length} athletes
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={isTimerRunning ? 'secondary' : 'default'}
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="h-7 px-2"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Global countdown to next set across all athletes */}
            {isTimerRunning && (() => {
              const allNextSets = athleteSchedules.flatMap((as) =>
                as.schedule.sets
                  .filter(
                    (s) =>
                      !as.completedSets.has(s.setNumber) &&
                      getSetStatus(s, now) === 'upcoming'
                  )
                  .map((s) => s.scheduledTime)
              );
              const nextTime = allNextSets.length > 0
                ? new Date(Math.min(...allNextSets.map((d) => d.getTime())))
                : null;

              if (!nextTime) return null;

              const remaining = nextTime.getTime() - now.getTime();
              return (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Next warm-up set in
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-mono font-bold tabular-nums',
                      remaining < 60_000
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground'
                    )}
                  >
                    {formatCountdown(remaining)}
                  </p>
                </div>
              );
            })()}

            {/* Grid: rows = warm-up sets, columns = athletes */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-xs text-muted-foreground w-20">
                      Time
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-xs text-muted-foreground w-24">
                      Set
                    </th>
                    {athleteSchedules.map((as) => (
                      <th
                        key={as.entry.id}
                        className="text-center py-2 px-2 font-medium text-xs min-w-[100px]"
                      >
                        <div>{as.entry.athleteName.split(' ')[0]}</div>
                        <div className="text-muted-foreground font-normal">
                          {as.schedule.opener} kg
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Use the first athlete's schedule for row structure (all share same times) */}
                  {athleteSchedules[0]?.schedule.sets.map((refSet, setIdx) => {
                    const status = isTimerRunning
                      ? getSetStatus(refSet, now)
                      : 'upcoming';

                    return (
                      <tr
                        key={refSet.setNumber}
                        className={cn(
                          'border-b last:border-b-0 transition-colors',
                          status === 'current' &&
                            'bg-green-50 dark:bg-green-950/30',
                          status === 'past' && 'opacity-60'
                        )}
                      >
                        <td className="py-2 pr-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {formatTime(refSet.scheduledTime)}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">
                              {refSet.label}
                            </span>
                            {status === 'current' && (
                              <Badge
                                variant="default"
                                className="bg-green-600 text-white text-[10px] h-4"
                              >
                                NOW
                              </Badge>
                            )}
                          </div>
                        </td>
                        {athleteSchedules.map((as, athleteIdx) => {
                          const athleteSet = as.schedule.sets[setIdx];
                          if (!athleteSet) return <td key={as.entry.id} />;

                          const isCompleted = as.completedSets.has(
                            athleteSet.setNumber
                          );

                          return (
                            <td key={as.entry.id} className="py-2 px-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSetComplete(
                                    athleteIdx,
                                    athleteSet.setNumber
                                  )
                                }
                                className={cn(
                                  'flex items-center justify-center gap-1.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                                  isCompleted
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : status === 'current'
                                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-700'
                                      : 'bg-muted/50 hover:bg-muted text-foreground'
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <span className="font-mono font-medium">
                                  {athleteSet.weight}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Progress summary per athlete */}
            <div className="flex flex-wrap gap-2">
              {athleteSchedules.map((as) => {
                const totalSets = as.schedule.sets.length;
                const completedCount = as.completedSets.size;
                const allDone = completedCount === totalSets;

                return (
                  <div
                    key={as.entry.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
                      allDone
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                        : 'border-border'
                    )}
                  >
                    {allDone ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">
                      {as.entry.athleteName.split(' ')[0]}
                    </span>
                    <span className="text-muted-foreground">
                      {completedCount}/{totalSets}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
