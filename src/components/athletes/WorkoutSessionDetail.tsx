'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Target,
  Dumbbell,
  Clock,
  Timer,
  TrendingUp,
  TrendingDown,
  MessageSquare,
} from 'lucide-react';

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

interface SetData {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: string;
  rpe: number | null;
  rir: number | null;
  velocity: number | null;
  notes: string | null;
}

interface ExerciseData {
  id: string;
  name: string;
  category: string | null;
  supersetGroup: string | null;
  supersetColor: string | null;
  notes: string | null;
  athleteNotes: string | null;
  prescribed: PrescribedData;
  sets: SetData[];
  totalVolume: number;
}

export interface SessionDetailData {
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
  exercises: ExerciseData[];
}

type CompletionStatus = 'met' | 'partial' | 'missed';

function getExerciseStatus(
  prescribed: PrescribedData,
  actualSets: SetData[]
): CompletionStatus {
  if (actualSets.length === 0) return 'missed';

  const prescribedSetsNum = parseInt(prescribed.sets || '0', 10) || 0;
  const prescribedRepsNum = parseInt(prescribed.reps || '0', 10) || 0;

  if (prescribedSetsNum === 0 && prescribedRepsNum === 0) {
    return actualSets.length > 0 ? 'met' : 'missed';
  }

  const completedSets = actualSets.length;
  const allRepsMet = actualSets.every((s) => s.reps >= prescribedRepsNum);

  if (completedSets >= prescribedSetsNum && allRepsMet) return 'met';
  if (completedSets > 0) return 'partial';
  return 'missed';
}

function formatWeight(weight: number): string {
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(1);
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${Math.round(volume)}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

function formatActualSummary(sets: SetData[]): string {
  if (sets.length === 0) return 'No sets logged';
  const repsRange = sets.map((s) => s.reps);
  const minReps = Math.min(...repsRange);
  const maxReps = Math.max(...repsRange);
  const weights = sets.filter((s) => s.weight > 0).map((s) => s.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

  let summary = `${sets.length}×`;
  summary += minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;

  if (maxWeight > 0) {
    summary += ' @ ';
    summary += minWeight === maxWeight
      ? `${formatWeight(maxWeight)}`
      : `${formatWeight(minWeight)}-${formatWeight(maxWeight)}`;
  }

  const rpesLogged = sets.filter((s) => s.rpe != null);
  if (rpesLogged.length > 0) {
    const avgRpe = rpesLogged.reduce((sum, s) => sum + s.rpe!, 0) / rpesLogged.length;
    summary += ` RPE ${avgRpe % 1 === 0 ? avgRpe : avgRpe.toFixed(1)}`;
  }

  return summary;
}

const STATUS_CONFIG: Record<CompletionStatus, {
  label: string;
  icon: typeof CheckCircle2;
  textColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  met: {
    label: 'Met',
    icon: CheckCircle2,
    textColor: 'text-green-600',
    bgColor: 'bg-green-500/5',
    borderColor: 'border-l-green-500',
  },
  partial: {
    label: 'Partial',
    icon: AlertCircle,
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-l-amber-500',
  },
  missed: {
    label: 'Missed',
    icon: XCircle,
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-l-red-500',
  },
};

export function WorkoutSessionDetail({ session }: { session: SessionDetailData }) {
  const volumePct = session.totalPrescribedVolume > 0
    ? Math.round((session.totalActualVolume / session.totalPrescribedVolume) * 100)
    : null;

  const exercisesMet = session.exercises.filter(
    (ex) => getExerciseStatus(ex.prescribed, ex.sets) === 'met'
  ).length;
  const exercisesPartial = session.exercises.filter(
    (ex) => getExerciseStatus(ex.prescribed, ex.sets) === 'partial'
  ).length;
  const exercisesMissed = session.exercises.filter(
    (ex) => getExerciseStatus(ex.prescribed, ex.sets) === 'missed'
  ).length;

  return (
    <div className="space-y-4">
      {/* Session Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Exercises</p>
          <p className="text-lg font-bold tabular-nums">{session.exercises.length}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className={cn(
            'text-lg font-bold tabular-nums',
            session.completionPercentage >= 80 ? 'text-green-600' :
            session.completionPercentage >= 50 ? 'text-amber-600' : 'text-red-500'
          )}>
            {Math.round(session.completionPercentage)}%
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-lg font-bold tabular-nums">
            {session.totalActualVolume > 0 ? `${formatVolume(session.totalActualVolume)} kg` : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-lg font-bold tabular-nums">
            {session.durationSeconds ? formatDuration(session.durationSeconds) : '—'}
          </p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {exercisesMet} met
        </span>
        <span className="flex items-center gap-1.5 text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {exercisesPartial} partial
        </span>
        <span className="flex items-center gap-1.5 text-red-500">
          <XCircle className="h-3.5 w-3.5" />
          {exercisesMissed} missed
        </span>
      </div>

      {/* Exercise Comparison Table */}
      {session.exercises.length > 0 && (
        <div className="space-y-3">
          {session.exercises.map((ex) => {
            const status = getExerciseStatus(ex.prescribed, ex.sets);
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;

            const prescribedSetsNum = parseInt(ex.prescribed.sets || '0', 10) || 0;
            const prescribedRepsNum = parseInt(ex.prescribed.reps || '0', 10) || 0;
            const prescribedLoadNum = parseFloat(ex.prescribed.load || '0') || 0;
            const prescribedVolume = prescribedSetsNum * prescribedRepsNum * prescribedLoadNum;

            const volumeDiff = prescribedVolume > 0
              ? Math.round(((ex.totalVolume - prescribedVolume) / prescribedVolume) * 100)
              : null;

            return (
              <div
                key={ex.id}
                className={cn(
                  'rounded-lg border border-l-4 overflow-hidden',
                  config.borderColor,
                  config.bgColor
                )}
              >
                {/* Exercise Header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
                  <StatusIcon className={cn('h-4 w-4 shrink-0', config.textColor)} />
                  <span className="text-sm font-semibold truncate flex-1">{ex.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      status === 'met' && 'border-green-300 text-green-700 bg-green-50',
                      status === 'partial' && 'border-amber-300 text-amber-700 bg-amber-50',
                      status === 'missed' && 'border-red-300 text-red-700 bg-red-50'
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>

                {/* Two-column Prescribed vs Actual */}
                <div className="grid grid-cols-2 divide-x divide-border/50">
                  {/* Prescribed Column */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Prescribed
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrescription(ex.prescribed)}
                    </p>
                    {prescribedVolume > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Vol: {formatVolume(prescribedVolume)} kg
                      </p>
                    )}
                    {ex.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="italic">{ex.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actual Column */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Actual
                      </span>
                    </div>
                    {ex.sets.length > 0 ? (
                      <>
                        <p className="text-sm font-medium">
                          {formatActualSummary(ex.sets)}
                        </p>
                        {ex.totalVolume > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Vol: {formatVolume(ex.totalVolume)} kg
                            </span>
                            {volumeDiff !== null && (
                              <span className={cn(
                                'text-xs font-medium flex items-center gap-0.5',
                                volumeDiff >= 0 ? 'text-green-600' : 'text-red-500'
                              )}>
                                {volumeDiff >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {volumeDiff > 0 ? '+' : ''}{volumeDiff}%
                              </span>
                            )}
                          </div>
                        )}
                        {ex.athleteNotes && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="italic">{ex.athleteNotes}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-red-500/80">No sets logged</p>
                    )}
                  </div>
                </div>

                {/* Set-by-Set Breakdown */}
                {ex.sets.length > 0 && (
                  <div className="border-t border-border/50 px-4 py-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 font-medium w-8">Set</th>
                          <th className="text-right py-1 font-medium">Weight</th>
                          <th className="text-right py-1 font-medium">Reps</th>
                          <th className="text-right py-1 font-medium">RPE</th>
                          {ex.sets.some((s) => s.velocity != null) && (
                            <th className="text-right py-1 font-medium">Velocity</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((set) => {
                          const repsMatch = prescribedRepsNum > 0 && set.reps >= prescribedRepsNum;
                          const rpeMatch = ex.prescribed.rpe != null && set.rpe != null
                            ? set.rpe <= ex.prescribed.rpe + 0.5
                            : null;

                          return (
                            <tr key={set.id} className="border-t border-border/30">
                              <td className="py-1 text-muted-foreground tabular-nums">
                                {set.setNumber}
                              </td>
                              <td className="py-1 text-right tabular-nums font-medium">
                                {set.weight > 0
                                  ? `${formatWeight(set.weight)} ${set.unit}`
                                  : 'BW'}
                              </td>
                              <td className={cn(
                                'py-1 text-right tabular-nums font-medium',
                                prescribedRepsNum > 0 && (repsMatch ? 'text-green-600' : 'text-red-500')
                              )}>
                                {set.reps}
                              </td>
                              <td className={cn(
                                'py-1 text-right tabular-nums',
                                rpeMatch === true && 'text-green-600',
                                rpeMatch === false && 'text-red-500'
                              )}>
                                {set.rpe != null ? set.rpe : '—'}
                              </td>
                              {ex.sets.some((s) => s.velocity != null) && (
                                <td className="py-1 text-right tabular-nums text-muted-foreground">
                                  {set.velocity != null ? `${set.velocity.toFixed(2)} m/s` : '—'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total Volume Comparison */}
      {(session.totalPrescribedVolume > 0 || session.totalActualVolume > 0) && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Total Volume Comparison
          </h4>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Prescribed:</span>
                <span className="text-sm font-semibold tabular-nums">
                  {session.totalPrescribedVolume > 0
                    ? `${formatVolume(session.totalPrescribedVolume)} kg`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Actual:</span>
                <span className="text-sm font-semibold tabular-nums">
                  {session.totalActualVolume > 0
                    ? `${formatVolume(session.totalActualVolume)} kg`
                    : '—'}
                </span>
              </div>
            </div>
            {volumePct !== null && (
              <div className="text-right">
                <p className={cn(
                  'text-2xl font-bold tabular-nums',
                  volumePct >= 90 ? 'text-green-600' :
                  volumePct >= 70 ? 'text-amber-600' : 'text-red-500'
                )}>
                  {volumePct}%
                </p>
                <p className="text-xs text-muted-foreground">of prescribed</p>
              </div>
            )}
          </div>
          {/* Volume bar */}
          {volumePct !== null && (
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  volumePct >= 90 ? 'bg-green-500' :
                  volumePct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(volumePct, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {session.exercises.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No exercise data available for this session.
        </p>
      )}
    </div>
  );
}
