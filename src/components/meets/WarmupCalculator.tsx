'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Standard warm-up percentages of opener weight
const DEFAULT_WARMUP_PERCENTAGES = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
// Default time between warm-up attempts in minutes
const DEFAULT_INTERVAL_MINUTES = 3;

interface WarmupSet {
  setNumber: number;
  percentage: number;
  weight: number;
  scheduledTime: Date;
  label: string;
}

interface WarmupSchedule {
  lift: string;
  opener: number;
  flightStartTime: Date;
  intervalMinutes: number;
  sets: WarmupSet[];
}

function roundToNearest(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment;
}

function generateWarmupSchedule(
  lift: string,
  opener: number,
  flightStartTime: Date,
  intervalMinutes: number = DEFAULT_INTERVAL_MINUTES
): WarmupSchedule {
  const percentages = DEFAULT_WARMUP_PERCENTAGES;
  const sets: WarmupSet[] = [];

  // Work backward from flight start time
  // The opener (100%) should be ~intervalMinutes before flight start
  // Each preceding set is intervalMinutes before the next
  for (let i = percentages.length - 1; i >= 0; i--) {
    const pct = percentages[i];
    const weight = roundToNearest(opener * pct);
    const minutesBefore = (percentages.length - i) * intervalMinutes;
    const scheduledTime = new Date(
      flightStartTime.getTime() - minutesBefore * 60 * 1000
    );

    const isOpener = pct === 1.0;
    const label = isOpener
      ? 'Opener'
      : `Warm-up ${i + 1} (${Math.round(pct * 100)}%)`;

    sets.push({
      setNumber: i + 1,
      percentage: pct,
      weight,
      scheduledTime,
      label,
    });
  }

  // Sort by time ascending
  sets.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  return {
    lift,
    opener,
    flightStartTime,
    intervalMinutes,
    sets,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getSetStatus(
  set: WarmupSet,
  now: Date
): 'upcoming' | 'current' | 'past' {
  const diffMs = set.scheduledTime.getTime() - now.getTime();
  // "current" if within 30 seconds of scheduled time
  if (Math.abs(diffMs) < 30_000) return 'current';
  if (diffMs < 0) return 'past';
  return 'upcoming';
}

// --- Countdown Timer Hook ---
function useCountdown(targetTime: Date | null, isRunning: boolean) {
  const [remaining, setRemaining] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning || !targetTime) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    function tick() {
      const now = new Date();
      const diff = targetTime!.getTime() - now.getTime();
      setRemaining(Math.max(0, diff));
    }

    tick(); // immediate
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetTime, isRunning]);

  return remaining;
}

// --- Warmup Schedule Display ---
function WarmupScheduleView({
  schedule,
  isTimerRunning,
}: {
  schedule: WarmupSchedule;
  isTimerRunning: boolean;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Find next upcoming set for countdown
  const nextSet = schedule.sets.find(
    (s) => getSetStatus(s, now) === 'upcoming'
  );
  const currentSet = schedule.sets.find(
    (s) => getSetStatus(s, now) === 'current'
  );
  const activeSet = currentSet ?? nextSet;

  const countdownRemaining = useCountdown(
    activeSet?.scheduledTime ?? null,
    isTimerRunning
  );

  return (
    <div className="space-y-3">
      {/* Countdown display */}
      {isTimerRunning && activeSet && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            {currentSet ? 'NOW' : 'Next warm-up in'}
          </p>
          <p
            className={cn(
              'text-4xl font-mono font-bold tabular-nums',
              currentSet
                ? 'text-green-600 dark:text-green-400'
                : countdownRemaining < 60_000
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground'
            )}
          >
            {currentSet ? 'GO!' : formatCountdown(countdownRemaining)}
          </p>
          <p className="text-sm mt-1 font-medium">
            {activeSet.weight} kg — {activeSet.label}
          </p>
        </div>
      )}

      {/* Set list */}
      <div className="space-y-1.5">
        {schedule.sets.map((set) => {
          const status = isTimerRunning ? getSetStatus(set, now) : 'upcoming';
          return (
            <div
              key={set.setNumber}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                status === 'current' &&
                  'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800',
                status === 'past' && 'opacity-50',
                status === 'upcoming' && 'bg-muted/50'
              )}
            >
              <div className="w-16 text-xs text-muted-foreground font-mono">
                {formatTime(set.scheduledTime)}
              </div>
              <div className="flex-1 font-medium">{set.weight} kg</div>
              <div className="text-xs text-muted-foreground">{set.label}</div>
              {status === 'current' && (
                <Badge
                  variant="default"
                  className="bg-green-600 text-white text-[10px]"
                >
                  NOW
                </Badge>
              )}
              {status === 'past' && (
                <Badge variant="secondary" className="text-[10px]">
                  Done
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---
interface WarmupCalculatorProps {
  athleteName: string;
  entryId: string;
  estimatedMaxes: {
    squat?: number;
    bench?: number;
    deadlift?: number;
  };
  plannedOpeners: {
    squat?: number;
    bench?: number;
    deadlift?: number;
  };
}

const LIFT_OPTIONS = [
  { value: 'squat', label: 'Squat' },
  { value: 'bench', label: 'Bench' },
  { value: 'deadlift', label: 'Deadlift' },
] as const;

export function WarmupCalculator({
  athleteName,
  plannedOpeners,
}: WarmupCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLift, setSelectedLift] = useState<string>('squat');
  const [flightStartTimeStr, setFlightStartTimeStr] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(
    String(DEFAULT_INTERVAL_MINUTES)
  );
  const [openerOverride, setOpenerOverride] = useState('');
  const [schedule, setSchedule] = useState<WarmupSchedule | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get opener for selected lift
  const defaultOpener =
    plannedOpeners[selectedLift as keyof typeof plannedOpeners];
  const opener = openerOverride
    ? parseFloat(openerOverride)
    : defaultOpener ?? 0;

  const handleGenerate = useCallback(() => {
    if (!flightStartTimeStr || !opener) return;

    // Parse time string into today's date
    const [hours, minutes] = flightStartTimeStr.split(':').map(Number);
    const flightStart = new Date();
    flightStart.setHours(hours, minutes, 0, 0);

    const interval = parseFloat(intervalMinutes) || DEFAULT_INTERVAL_MINUTES;
    const liftLabel =
      LIFT_OPTIONS.find((l) => l.value === selectedLift)?.label ?? selectedLift;

    const newSchedule = generateWarmupSchedule(
      liftLabel,
      opener,
      flightStart,
      interval
    );
    setSchedule(newSchedule);
    setIsTimerRunning(false);
  }, [flightStartTimeStr, opener, intervalMinutes, selectedLift]);

  const handleReset = () => {
    setSchedule(null);
    setIsTimerRunning(false);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Warm-up Calculator — {athleteName}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Configuration form */}
          {!schedule && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lift</Label>
                <select
                  value={selectedLift}
                  onChange={(e) => {
                    setSelectedLift(e.target.value);
                    setOpenerOverride('');
                  }}
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
                  Flight Start Time
                </Label>
                <Input
                  type="time"
                  value={flightStartTimeStr}
                  onChange={(e) => setFlightStartTimeStr(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Opener (kg)
                  {defaultOpener && (
                    <span className="text-muted-foreground ml-1">
                      planned: {defaultOpener}
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  step="2.5"
                  value={openerOverride || (defaultOpener ?? '')}
                  onChange={(e) => setOpenerOverride(e.target.value)}
                  placeholder="kg"
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

              <div className="col-span-2">
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!flightStartTimeStr || !opener}
                  className="w-full"
                >
                  <Timer className="h-4 w-4 mr-1" />
                  Generate Warm-up Schedule
                </Button>
              </div>
            </div>
          )}

          {/* Schedule display */}
          {schedule && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{schedule.lift}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-muted-foreground">
                    {schedule.opener} kg opener
                  </span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-muted-foreground">
                    Flight at {formatTime(schedule.flightStartTime)}
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

              <WarmupScheduleView
                schedule={schedule}
                isTimerRunning={isTimerRunning}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
