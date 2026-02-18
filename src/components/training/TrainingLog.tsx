'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SetLogData {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: string;
  rpe: number | null;
  rir: number | null;
  velocity: number | null;
  completedAt: string;
  notes: string | null;
}

interface PreviousPerf {
  reps: number;
  weight: number;
  unit: string;
  rpe: number | null;
}

interface ExerciseData {
  id: string;
  order: number;
  prescriptionType: string;
  prescribedSets: string | null;
  prescribedReps: string | null;
  prescribedLoad: string | null;
  prescribedRPE: number | null;
  prescribedRIR: number | null;
  velocityTarget: number | null;
  percentageOf1RM: number | null;
  supersetGroup: string | null;
  supersetColor: string | null;
  isUnilateral: boolean;
  restTimeSeconds: number | null;
  tempo: string | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    equipment: string | null;
    primaryMuscles: string[] | string;
  };
  setLogs: SetLogData[];
  previousPerformance: PreviousPerf[];
}

interface SessionData {
  id: string;
  date: string;
  title: string | null;
  status: string;
  completionPercentage: number;
  completedItems: number;
  totalItems: number;
  program: { id: string; name: string } | null;
}

interface TrainResponse {
  session: SessionData | null;
  exercises: ExerciseData[];
  message?: string;
}

interface AthleteOption {
  id: string;
  name: string;
}

interface TrainingLogProps {
  athletes: AthleteOption[];
  initialAthleteId?: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function displayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

function prescriptionLabel(ex: ExerciseData): string {
  const parts: string[] = [];

  if (ex.prescribedSets) {
    const reps = ex.prescribedReps ?? '?';
    parts.push(`${ex.prescribedSets}×${reps}`);
  }

  if (ex.prescriptionType === 'percentage' && ex.percentageOf1RM) {
    parts.push(`@ ${ex.percentageOf1RM}%`);
  } else if (ex.prescriptionType === 'rpe' && ex.prescribedRPE) {
    parts.push(`@ RPE ${ex.prescribedRPE}`);
  } else if (ex.prescriptionType === 'rir' && ex.prescribedRIR != null) {
    parts.push(`@ ${ex.prescribedRIR} RIR`);
  } else if (ex.prescriptionType === 'velocity' && ex.velocityTarget) {
    parts.push(`@ ${ex.velocityTarget} m/s`);
  } else if (ex.prescribedLoad) {
    parts.push(`@ ${ex.prescribedLoad}`);
  }

  return parts.join(' ') || 'No prescription';
}

function prescriptionTypeBadge(type: string): string {
  const map: Record<string, string> = {
    percentage: '%1RM',
    rpe: 'RPE',
    rir: 'RIR',
    velocity: 'VBT',
    autoregulated: 'Auto',
    fixed: 'Fixed',
  };
  return map[type] ?? type;
}

function ExerciseCard({ exercise }: { exercise: ExerciseData }) {
  const completedSets = exercise.setLogs.length;
  const totalSets = exercise.prescribedSets ? parseInt(exercise.prescribedSets, 10) : 0;
  const isComplete = totalSets > 0 && completedSets >= totalSets;
  const prevPerf = exercise.previousPerformance[0];

  return (
    <Card className={cn(
      'transition-all',
      isComplete && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20',
      exercise.supersetColor && `border-l-4`,
    )} style={exercise.supersetColor ? { borderLeftColor: exercise.supersetColor } : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <h3 className="font-semibold text-base truncate">{exercise.exercise.name}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-7">
              <span className="text-sm font-medium">{prescriptionLabel(exercise)}</span>
              <Badge variant="secondary" className="text-xs">
                {prescriptionTypeBadge(exercise.prescriptionType)}
              </Badge>
              {exercise.supersetGroup && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={exercise.supersetColor ? { borderColor: exercise.supersetColor, color: exercise.supersetColor } : undefined}
                >
                  SS: {exercise.supersetGroup}
                </Badge>
              )}
              {exercise.isUnilateral && (
                <Badge variant="outline" className="text-xs">Unilateral</Badge>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-sm font-medium tabular-nums">
              {completedSets}/{totalSets || '?'}
            </span>
            <p className="text-xs text-muted-foreground">sets</p>
          </div>
        </div>

        {/* Tempo / rest info */}
        {(exercise.tempo || exercise.restTimeSeconds) && (
          <div className="flex items-center gap-3 ml-7 mt-2 text-xs text-muted-foreground">
            {exercise.tempo && <span>Tempo: {exercise.tempo}</span>}
            {exercise.restTimeSeconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {exercise.restTimeSeconds}s rest
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {exercise.notes && (
          <div className="ml-7 mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{exercise.notes}</span>
          </div>
        )}

        {/* Previous performance reference */}
        {prevPerf && (
          <div className="ml-7 mt-2 text-xs text-muted-foreground">
            Last: {prevPerf.weight} {prevPerf.unit} × {prevPerf.reps}
            {prevPerf.rpe != null && ` @ RPE ${prevPerf.rpe}`}
          </div>
        )}

        {/* Completed sets summary */}
        {exercise.setLogs.length > 0 && (
          <div className="ml-7 mt-3 space-y-1">
            {exercise.setLogs.map((set) => (
              <div
                key={set.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="tabular-nums">
                  Set {set.setNumber}: {set.weight} {set.unit} × {set.reps}
                  {set.rpe != null && ` @ RPE ${set.rpe}`}
                  {set.velocity != null && ` @ ${set.velocity} m/s`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrainingLog({ athletes, initialAthleteId }: TrainingLogProps) {
  const [athleteId, setAthleteId] = useState(initialAthleteId ?? athletes[0]?.id ?? '');
  const [date, setDate] = useState(formatDate(new Date()));
  const [data, setData] = useState<TrainResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkout = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/train?athleteId=${athleteId}&date=${date}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [athleteId, date]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setDate(formatDate(d));
  };

  const selectedAthlete = athletes.find((a) => a.id === athleteId);

  // Calculate completion
  const session = data?.session;
  const exercises = data?.exercises ?? [];
  const totalExercises = exercises.length;
  const completedExercises = exercises.filter((ex) => {
    const total = ex.prescribedSets ? parseInt(ex.prescribedSets, 10) : 0;
    return total > 0 && ex.setLogs.length >= total;
  }).length;
  const completionPercent = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;
  const totalVolume = exercises.reduce((sum, ex) =>
    sum + ex.setLogs.reduce((s, set) => s + set.weight * set.reps, 0), 0
  );
  const totalSetsLogged = exercises.reduce((sum, ex) => sum + ex.setLogs.length, 0);

  return (
    <div className="space-y-4">
      {/* Athlete selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-medium border-none outline-none"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday(date) && (
            <Button variant="ghost" size="sm" onClick={() => setDate(formatDate(new Date()))}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No workout */}
      {!loading && (!data?.session || exercises.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">No workout scheduled</h3>
            <p className="text-sm text-muted-foreground">
              {selectedAthlete?.name ?? 'This athlete'} has no workout assigned for{' '}
              {isToday(date) ? 'today' : displayDate(date)}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workout display */}
      {!loading && session && exercises.length > 0 && (
        <>
          {/* Session header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {session.title ?? 'Workout'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {displayDate(date)}
                    {session.program && ` · ${session.program.name}`}
                  </p>
                </div>
                <Badge
                  variant={
                    session.status === 'FULLY_COMPLETED' ? 'default' :
                    session.status === 'PARTIALLY_COMPLETED' ? 'secondary' :
                    'outline'
                  }
                >
                  {session.status === 'FULLY_COMPLETED' ? 'Complete' :
                   session.status === 'PARTIALLY_COMPLETED' ? 'In Progress' :
                   'Not Started'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedExercises}/{totalExercises} exercises</span>
                  <span>{totalSetsLogged} sets logged</span>
                  {totalVolume > 0 && (
                    <span>{totalVolume.toLocaleString()} lbs volume</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise list */}
          <div className="space-y-3">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
