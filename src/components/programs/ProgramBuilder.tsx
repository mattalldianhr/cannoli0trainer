'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type ProgramFormState,
  type WeekState,
  type DayState,
  type ExerciseEntry,
  type ProgramType,
  type PeriodizationType,
  PERIODIZATION_TYPE_LABELS,
  PROGRAM_TYPE_LABELS,
  PRESCRIPTION_TYPE_LABELS,
  createDefaultProgramForm,
  createDefaultWeek,
  createDefaultDay,
  createDefaultExerciseEntry,
} from '@/lib/programs/types';
import { ExercisePicker } from './ExercisePicker';

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface ProgramBuilderProps {
  coachId: string;
}

export function ProgramBuilder({ coachId }: ProgramBuilderProps) {
  const [program, setProgram] = useState<ProgramFormState>(createDefaultProgramForm);

  // Track which weeks/days are collapsed
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  // Exercise picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetDayId, setPickerTargetDayId] = useState<string | null>(null);

  // ============================================================
  // Program metadata
  // ============================================================

  const updateField = useCallback(
    <K extends keyof ProgramFormState>(field: K, value: ProgramFormState[K]) => {
      setProgram((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ============================================================
  // Week operations
  // ============================================================

  const addWeek = useCallback(() => {
    setProgram((prev) => ({
      ...prev,
      weeks: [
        ...prev.weeks,
        createDefaultWeek(prev.weeks.length + 1, crypto.randomUUID()),
      ],
    }));
  }, []);

  const removeWeek = useCallback((weekId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks
        .filter((w) => w.id !== weekId)
        .map((w, i) => ({ ...w, weekNumber: i + 1 })),
    }));
  }, []);

  const duplicateWeek = useCallback((weekId: string) => {
    setProgram((prev) => {
      const sourceIdx = prev.weeks.findIndex((w) => w.id === weekId);
      if (sourceIdx === -1) return prev;
      const source = prev.weeks[sourceIdx];

      const newWeek: WeekState = {
        id: crypto.randomUUID(),
        weekNumber: prev.weeks.length + 1,
        days: source.days.map((day) => ({
          ...day,
          id: crypto.randomUUID(),
          workoutId: undefined,
          exercises: day.exercises.map((ex) => ({
            ...ex,
            id: crypto.randomUUID(),
            workoutExerciseId: undefined,
          })),
        })),
      };

      return { ...prev, weeks: [...prev.weeks, newWeek] };
    });
  }, []);

  const toggleWeekCollapse = useCallback((weekId: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }, []);

  // ============================================================
  // Day operations
  // ============================================================

  const addDay = useCallback((weekId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId
          ? {
              ...w,
              days: [
                ...w.days,
                createDefaultDay(w.days.length + 1, crypto.randomUUID()),
              ],
            }
          : w
      ),
    }));
  }, []);

  const removeDay = useCallback((weekId: string, dayId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId
          ? {
              ...w,
              days: w.days
                .filter((d) => d.id !== dayId)
                .map((d, i) => ({ ...d, dayNumber: i + 1, name: `Day ${i + 1}` })),
            }
          : w
      ),
    }));
  }, []);

  const duplicateDay = useCallback((weekId: string, dayId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.id !== weekId) return w;
        const source = w.days.find((d) => d.id === dayId);
        if (!source) return w;

        const newDay: DayState = {
          ...source,
          id: crypto.randomUUID(),
          workoutId: undefined,
          dayNumber: w.days.length + 1,
          name: `Day ${w.days.length + 1}`,
          exercises: source.exercises.map((ex) => ({
            ...ex,
            id: crypto.randomUUID(),
            workoutExerciseId: undefined,
          })),
        };

        return { ...w, days: [...w.days, newDay] };
      }),
    }));
  }, []);

  const updateDayName = useCallback((weekId: string, dayId: string, name: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId
          ? {
              ...w,
              days: w.days.map((d) => (d.id === dayId ? { ...d, name } : d)),
            }
          : w
      ),
    }));
  }, []);

  const updateDayNotes = useCallback((weekId: string, dayId: string, notes: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === weekId
          ? {
              ...w,
              days: w.days.map((d) => (d.id === dayId ? { ...d, notes } : d)),
            }
          : w
      ),
    }));
  }, []);

  const toggleDayCollapse = useCallback((dayId: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }, []);

  // ============================================================
  // Exercise operations (add from picker)
  // ============================================================

  const openExercisePicker = useCallback((dayId: string) => {
    setPickerTargetDayId(dayId);
    setPickerOpen(true);
  }, []);

  const handleExerciseSelect = useCallback(
    (exercise: { id: string; name: string }) => {
      if (!pickerTargetDayId) return;
      setProgram((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== pickerTargetDayId) return d;
            const entry = createDefaultExerciseEntry(
              exercise.id,
              exercise.name,
              d.exercises.length + 1,
              crypto.randomUUID()
            );
            return { ...d, exercises: [...d.exercises, entry] };
          }),
        })),
      }));
      setPickerTargetDayId(null);
    },
    [pickerTargetDayId]
  );

  const removeExercise = useCallback((dayId: string, exerciseId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => {
          if (d.id !== dayId) return d;
          return {
            ...d,
            exercises: d.exercises
              .filter((ex) => ex.id !== exerciseId)
              .map((ex, i) => ({ ...ex, order: i + 1 })),
          };
        }),
      })),
    }));
  }, []);

  // ============================================================
  // Summary stats
  // ============================================================

  const totalWeeks = program.weeks.length;
  const totalDays = program.weeks.reduce((sum, w) => sum + w.days.length, 0);
  const totalExercises = program.weeks.reduce(
    (sum, w) => sum + w.days.reduce((dsum, d) => dsum + d.exercises.length, 0),
    0
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Program</h1>
      </div>

      {/* Program Info */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Program Details</h2>

          <div className="space-y-2">
            <Label htmlFor="program-name">Name *</Label>
            <Input
              id="program-name"
              value={program.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. 12-Week Peaking Block"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-description">Description</Label>
            <Textarea
              id="program-description"
              value={program.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Program description and goals..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program-type">Type</Label>
              <select
                id="program-type"
                value={program.type}
                onChange={(e) => updateField('type', e.target.value as ProgramType)}
                className={SELECT_CLASS}
              >
                {(Object.entries(PROGRAM_TYPE_LABELS) as [ProgramType, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodization-type">Periodization</Label>
              <select
                id="periodization-type"
                value={program.periodizationType ?? ''}
                onChange={(e) =>
                  updateField(
                    'periodizationType',
                    e.target.value ? (e.target.value as PeriodizationType) : null
                  )
                }
                className={SELECT_CLASS}
              >
                <option value="">None</option>
                {(
                  Object.entries(PERIODIZATION_TYPE_LABELS) as [PeriodizationType, string][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Structure Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Program Structure</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">{totalWeeks} week{totalWeeks !== 1 ? 's' : ''}</Badge>
            <Badge variant="secondary">{totalDays} day{totalDays !== 1 ? 's' : ''}</Badge>
            <Badge variant="secondary">
              {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <Button onClick={addWeek} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Week
        </Button>
      </div>

      {/* Weeks */}
      {program.weeks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No weeks yet. Click &quot;Add Week&quot; to start building your program.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {program.weeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              collapsed={collapsedWeeks.has(week.id)}
              collapsedDays={collapsedDays}
              onToggleCollapse={() => toggleWeekCollapse(week.id)}
              onToggleDayCollapse={toggleDayCollapse}
              onRemove={() => removeWeek(week.id)}
              onDuplicate={() => duplicateWeek(week.id)}
              onAddDay={() => addDay(week.id)}
              onRemoveDay={(dayId) => removeDay(week.id, dayId)}
              onDuplicateDay={(dayId) => duplicateDay(week.id, dayId)}
              onUpdateDayName={(dayId, name) => updateDayName(week.id, dayId, name)}
              onUpdateDayNotes={(dayId, notes) => updateDayNotes(week.id, dayId, notes)}
              onAddExercise={openExercisePicker}
              onRemoveExercise={removeExercise}
            />
          ))}
        </div>
      )}

      {/* Exercise Picker Dialog */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleExerciseSelect}
      />
    </div>
  );
}

// ============================================================
// Week Card
// ============================================================

interface WeekCardProps {
  week: WeekState;
  collapsed: boolean;
  collapsedDays: Set<string>;
  onToggleCollapse: () => void;
  onToggleDayCollapse: (dayId: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAddDay: () => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onUpdateDayName: (dayId: string, name: string) => void;
  onUpdateDayNotes: (dayId: string, notes: string) => void;
  onAddExercise: (dayId: string) => void;
  onRemoveExercise: (dayId: string, exerciseId: string) => void;
}

function WeekCard({
  week,
  collapsed,
  collapsedDays,
  onToggleCollapse,
  onToggleDayCollapse,
  onRemove,
  onDuplicate,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onUpdateDayNotes,
  onAddExercise,
  onRemoveExercise,
}: WeekCardProps) {
  const exerciseCount = week.days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Week Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <span className="font-semibold text-sm">Week {week.weekNumber}</span>

          <div className="flex gap-2 ml-2">
            <Badge variant="outline" className="text-xs">
              {week.days.length} day{week.days.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddDay}
              className="h-7 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Day
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-7 text-xs"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Week Content (days) */}
        {!collapsed && (
          <div className="p-4 space-y-3">
            {week.days.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No days yet. Click &quot;+ Day&quot; to add a training day.
              </p>
            ) : (
              week.days.map((day) => (
                <DayCard
                  key={day.id}
                  day={day}
                  weekNumber={week.weekNumber}
                  collapsed={collapsedDays.has(day.id)}
                  onToggleCollapse={() => onToggleDayCollapse(day.id)}
                  onRemove={() => onRemoveDay(day.id)}
                  onDuplicate={() => onDuplicateDay(day.id)}
                  onUpdateName={(name) => onUpdateDayName(day.id, name)}
                  onUpdateNotes={(notes) => onUpdateDayNotes(day.id, notes)}
                  onAddExercise={() => onAddExercise(day.id)}
                  onRemoveExercise={(exId) => onRemoveExercise(day.id, exId)}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Day Card
// ============================================================

interface DayCardProps {
  day: DayState;
  weekNumber: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdateName: (name: string) => void;
  onUpdateNotes: (notes: string) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
}

function DayCard({
  day,
  weekNumber,
  collapsed,
  onToggleCollapse,
  onRemove,
  onDuplicate,
  onUpdateName,
  onUpdateNotes,
  onAddExercise,
  onRemoveExercise,
}: DayCardProps) {
  const [showNotes, setShowNotes] = useState(day.notes.length > 0);

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      {/* Day Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onToggleCollapse}
          className="p-0.5 rounded hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <Input
          value={day.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="h-7 text-sm font-medium bg-transparent border-none px-1 max-w-40 focus-visible:ring-1"
          placeholder="Day name"
        />

        <Badge variant="outline" className="text-xs shrink-0">
          {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
        </Badge>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddExercise}
            className="h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Exercise
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className={cn('h-7 text-xs', showNotes && 'text-primary')}
          >
            Notes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            className="h-7 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Day Content */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {/* Day Notes */}
          {showNotes && (
            <Textarea
              value={day.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Day notes..."
              rows={2}
              className="text-sm"
            />
          )}

          {/* Exercise List */}
          {day.exercises.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No exercises. Click &quot;+ Exercise&quot; to add one.
            </p>
          ) : (
            <div className="space-y-1">
              {day.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  onRemove={() => onRemoveExercise(exercise.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Exercise Row (compact display)
// ============================================================

interface ExerciseRowProps {
  exercise: ExerciseEntry;
  onRemove: () => void;
}

function ExerciseRow({ exercise, onRemove }: ExerciseRowProps) {
  const prescriptionSummary = formatPrescription(exercise);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 group">
      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      <span className="text-xs text-muted-foreground w-5 shrink-0">{exercise.order}.</span>
      <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium truncate">{exercise.exerciseName}</span>
      <Badge variant="outline" className="text-xs shrink-0 ml-auto">
        {PRESCRIPTION_TYPE_LABELS[exercise.prescriptionType]}
      </Badge>
      {prescriptionSummary && (
        <span className="text-xs text-muted-foreground shrink-0">{prescriptionSummary}</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatPrescription(exercise: ExerciseEntry): string {
  const p = exercise.prescription;
  const setsReps = `${p.sets}x${p.reps}`;

  switch (p.type) {
    case 'percentage':
      return p.percentage ? `${setsReps} @ ${p.percentage}%` : setsReps;
    case 'rpe':
      return p.rpe ? `${setsReps} @ RPE ${p.rpe}` : setsReps;
    case 'rir':
      return p.rir != null ? `${setsReps} @ ${p.rir} RIR` : setsReps;
    case 'velocity':
      return p.velocityTarget ? `${setsReps} @ ${p.velocityTarget} m/s` : setsReps;
    case 'autoregulated':
      return p.instructions || setsReps;
    case 'fixed':
      return p.load ? `${setsReps} @ ${p.load} ${p.unit}` : setsReps;
  }
}
