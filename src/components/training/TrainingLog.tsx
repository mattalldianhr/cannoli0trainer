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
  History,
  Info,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Trophy,
  Weight,
  Repeat,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { RPESelector } from '@/components/shared/RPESelector';
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
  date: string;
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

interface SetFormValues {
  weight: string;
  reps: string;
  rpe: number | null;
  velocity: string;
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

/** Get default form values based on prescription, previous performance, or last logged set */
function getDefaultFormValues(exercise: ExerciseData): SetFormValues {
  const lastSet = exercise.setLogs[exercise.setLogs.length - 1];
  const prevPerf = exercise.previousPerformance[0];

  // Weight: last logged set > previous performance > prescribed load > empty
  let weight = '';
  if (lastSet) {
    weight = String(lastSet.weight);
  } else if (prevPerf) {
    weight = String(prevPerf.weight);
  } else if (exercise.prescribedLoad) {
    const parsed = parseFloat(exercise.prescribedLoad);
    if (!isNaN(parsed)) weight = String(parsed);
  }

  // Reps: prescribed reps > last set > previous performance > empty
  let reps = '';
  if (exercise.prescribedReps) {
    const parsed = parseInt(exercise.prescribedReps, 10);
    if (!isNaN(parsed)) reps = String(parsed);
  } else if (lastSet) {
    reps = String(lastSet.reps);
  } else if (prevPerf) {
    reps = String(prevPerf.reps);
  }

  // RPE: prescribed RPE > null
  const rpe = exercise.prescribedRPE ?? null;

  // Velocity: prescribed target > empty
  const velocity = exercise.velocityTarget ? String(exercise.velocityTarget) : '';

  return { weight, reps, rpe, velocity };
}

function SetLogRow({
  set,
  onUpdate,
  onDelete,
  saving,
}: {
  set: SetLogData;
  onUpdate: (id: string, data: { reps: number; weight: number; rpe: number | null; velocity: number | null }) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(String(set.weight));
  const [editReps, setEditReps] = useState(String(set.reps));
  const [editRPE, setEditRPE] = useState<number | null>(set.rpe);
  const [editVelocity, setEditVelocity] = useState(set.velocity != null ? String(set.velocity) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const w = parseFloat(editWeight);
    const r = parseInt(editReps, 10);
    if (isNaN(w) || isNaN(r) || w < 0 || r < 0) return;
    const v = editVelocity ? parseFloat(editVelocity) : null;
    onUpdate(set.id, { reps: r, weight: w, rpe: editRPE, velocity: v });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditWeight(String(set.weight));
    setEditReps(String(set.reps));
    setEditRPE(set.rpe);
    setEditVelocity(set.velocity != null ? String(set.velocity) : '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border border-border p-2 bg-muted/30">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
          Editing Set {set.setNumber}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Weight</label>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reps</label>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={editReps}
              onChange={(e) => setEditReps(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">RPE (optional)</label>
          <RPESelector
            value={editRPE}
            onChange={setEditRPE}
            allowClear
            showDescription={false}
            className="mt-0.5"
          />
        </div>
        {editVelocity !== '' && (
          <div>
            <label className="text-xs text-muted-foreground">Velocity (m/s)</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={editVelocity}
              onChange={(e) => setEditVelocity(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
            <Check className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-8">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      <span className="tabular-nums flex-1">
        Set {set.setNumber}: {set.weight} {set.unit} × {set.reps}
        {set.rpe != null && ` @ RPE ${set.rpe}`}
        {set.velocity != null && ` @ ${set.velocity} m/s`}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-muted"
          aria-label={`Edit set ${set.setNumber}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => { onDelete(set.id); setConfirmDelete(false); }}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"
              aria-label="Confirm delete"
              disabled={saving}
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="p-1 rounded hover:bg-muted"
              aria-label="Cancel delete"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1 rounded hover:bg-destructive/10 text-destructive"
            aria-label={`Delete set ${set.setNumber}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatPrevDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PreviousPerformance({ sets }: { sets: PreviousPerf[] }) {
  if (sets.length === 0) return null;

  const dateLabel = sets[0].date ? formatPrevDate(sets[0].date) : '';

  // Summarize: if all sets have the same weight and reps, show compact "3×5 @ 225 lbs"
  const allSameWeight = sets.every((s) => s.weight === sets[0].weight);
  const allSameReps = sets.every((s) => s.reps === sets[0].reps);

  if (allSameWeight && allSameReps && sets.length > 1) {
    const { weight, unit, reps, rpe } = sets[0];
    return (
      <div className="ml-7 mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="h-3 w-3 flex-shrink-0" />
        <span>
          Last{dateLabel && ` (${dateLabel})`}: {sets.length}×{reps} @ {weight} {unit}
          {rpe != null && ` RPE ${rpe}`}
        </span>
      </div>
    );
  }

  // Show individual sets when weights/reps vary
  return (
    <div className="ml-7 mt-2 space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="h-3 w-3 flex-shrink-0" />
        <span>Last{dateLabel && ` (${dateLabel})`}:</span>
      </div>
      <div className="ml-[18px] text-xs text-muted-foreground tabular-nums">
        {sets.map((s, i) => (
          <span key={i}>
            {i > 0 && ' · '}
            {s.weight} {s.unit} × {s.reps}
            {s.rpe != null && ` @${s.rpe}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  athleteId,
  onSetChange,
}: {
  exercise: ExerciseData;
  athleteId: string;
  onSetChange: () => void;
}) {
  const completedSets = exercise.setLogs.length;
  const totalSets = exercise.prescribedSets ? parseInt(exercise.prescribedSets, 10) : 0;
  const isComplete = totalSets > 0 && completedSets >= totalSets;
  const showVelocity = exercise.prescriptionType === 'velocity' || exercise.velocityTarget != null;

  const [expanded, setExpanded] = useState(!isComplete);
  const [saving, setSaving] = useState(false);

  // Form state for the new set
  const defaults = getDefaultFormValues(exercise);
  const [weight, setWeight] = useState(defaults.weight);
  const [reps, setReps] = useState(defaults.reps);
  const [rpe, setRPE] = useState<number | null>(defaults.rpe);
  const [velocity, setVelocity] = useState(defaults.velocity);

  const nextSetNumber = completedSets + 1;

  const handleLogSet = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w < 0 || r < 0) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        workoutExerciseId: exercise.id,
        athleteId,
        setNumber: nextSetNumber,
        reps: r,
        weight: w,
        unit: 'lbs',
      };
      if (rpe != null) body.rpe = rpe;
      const v = velocity ? parseFloat(velocity) : null;
      if (v != null && !isNaN(v)) body.velocity = v;

      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSetChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSet = async (
    id: string,
    data: { reps: number; weight: number; rpe: number | null; velocity: number | null },
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        onSetChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSet = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onSetChange();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn(
      'transition-all',
      isComplete && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20',
      exercise.supersetColor && 'border-l-4',
    )} style={exercise.supersetColor ? { borderLeftColor: exercise.supersetColor } : undefined}>
      <CardContent className="p-4">
        {/* Exercise header — tap to expand/collapse */}
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setExpanded(!expanded)}
        >
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
        </button>

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
        {exercise.previousPerformance.length > 0 && (
          <PreviousPerformance sets={exercise.previousPerformance} />
        )}

        {/* Expanded section: logged sets + new set form */}
        {expanded && (
          <div className="ml-7 mt-3 space-y-2">
            {/* Existing logged sets */}
            {exercise.setLogs.length > 0 && (
              <div className="space-y-1.5">
                {exercise.setLogs.map((set) => (
                  <SetLogRow
                    key={set.id}
                    set={set}
                    onUpdate={handleUpdateSet}
                    onDelete={handleDeleteSet}
                    saving={saving}
                  />
                ))}
              </div>
            )}

            {/* New set form */}
            <div className="rounded-md border border-dashed border-border p-3 space-y-3 bg-muted/20">
              <div className="text-xs font-medium text-muted-foreground">
                Set {nextSetNumber}{totalSets > 0 ? ` of ${totalSets}` : ''}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground" htmlFor={`weight-${exercise.id}`}>
                    Weight (lbs)
                  </label>
                  <Input
                    id={`weight-${exercise.id}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground" htmlFor={`reps-${exercise.id}`}>
                    Reps
                  </label>
                  <Input
                    id={`reps-${exercise.id}`}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* RPE input — shown for RPE, RIR, autoregulated, or if explicitly requested */}
              {(exercise.prescriptionType === 'rpe' || exercise.prescriptionType === 'rir' || exercise.prescriptionType === 'autoregulated') && (
                <div>
                  <label className="text-xs text-muted-foreground">RPE (optional)</label>
                  <RPESelector
                    value={rpe}
                    onChange={setRPE}
                    allowClear
                    showDescription={false}
                    className="mt-0.5"
                  />
                </div>
              )}

              {/* Velocity input — shown for VBT prescriptions */}
              {showVelocity && (
                <div>
                  <label className="text-xs text-muted-foreground" htmlFor={`velocity-${exercise.id}`}>
                    Velocity (m/s)
                  </label>
                  <Input
                    id={`velocity-${exercise.id}`}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={velocity}
                    onChange={(e) => setVelocity(e.target.value)}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              )}

              <Button
                size="sm"
                className="w-full h-9"
                onClick={handleLogSet}
                disabled={saving || !weight || !reps}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                Log Set {nextSetNumber}
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed: just show set count summary */}
        {!expanded && exercise.setLogs.length > 0 && (
          <div className="ml-7 mt-2 text-xs text-muted-foreground">
            {completedSets} set{completedSets !== 1 ? 's' : ''} logged
            {isComplete && ' — Complete'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkoutSummary({ exercises }: { exercises: ExerciseData[] }) {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.setLogs.length, 0);
  const totalReps = exercises.reduce(
    (sum, ex) => sum + ex.setLogs.reduce((s, set) => s + set.reps, 0),
    0,
  );
  const totalVolume = exercises.reduce(
    (sum, ex) => sum + ex.setLogs.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  const topRPE = exercises.reduce(
    (max, ex) => Math.max(max, ...ex.setLogs.map((s) => s.rpe ?? 0)),
    0,
  );
  const exerciseCount = exercises.length;

  const stats = [
    { label: 'Exercises', value: String(exerciseCount), icon: Dumbbell },
    { label: 'Sets', value: String(totalSets), icon: Repeat },
    { label: 'Reps', value: String(totalReps), icon: TrendingUp },
    { label: 'Volume', value: `${totalVolume.toLocaleString()} lbs`, icon: Weight },
  ];

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Workout Complete</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-background p-3 text-center"
            >
              <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        {topRPE > 0 && (
          <div className="mt-3 text-center text-sm text-muted-foreground">
            Top RPE: <span className="font-medium text-foreground">{topRPE}</span>
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
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                athleteId={athleteId}
                onSetChange={fetchWorkout}
              />
            ))}
          </div>

          {/* Workout completion summary */}
          {completionPercent === 100 && (
            <WorkoutSummary exercises={exercises} />
          )}
        </>
      )}
    </div>
  );
}
