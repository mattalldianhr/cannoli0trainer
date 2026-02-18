'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Settings2,
  Save,
  Loader2,
  StickyNote,
  Check,
  CloudOff,
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
  type PrescriptionType,
  type PrescriptionValues,
  type ProgramType,
  type PeriodizationType,
  type ProgramWithDetails,
  PERIODIZATION_TYPE_LABELS,
  PROGRAM_TYPE_LABELS,
  PRESCRIPTION_TYPE_LABELS,
  createDefaultProgramForm,
  createDefaultWeek,
  createDefaultDay,
  createDefaultExerciseEntry,
  createDefaultPrescription,
  programFormToPayload,
  programResponseToForm,
  templateToNewProgramForm,
} from '@/lib/programs/types';
import { ExercisePicker } from './ExercisePicker';

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface ProgramBuilderProps {
  coachId: string;
  /** If provided, the builder starts in edit mode with this program loaded */
  initialProgram?: ProgramWithDetails;
  /** If provided, the builder pre-populates from this template as a new program */
  templateProgram?: ProgramWithDetails;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'dirty';

export function ProgramBuilder({ coachId, initialProgram, templateProgram }: ProgramBuilderProps) {
  const [program, setProgram] = useState<ProgramFormState>(() => {
    if (initialProgram) return programResponseToForm(initialProgram);
    if (templateProgram) return templateToNewProgramForm(templateProgram);
    return createDefaultProgramForm();
  });

  // Track whether this program has been persisted (edit mode or after first save)
  const [programId, setProgramId] = useState<string | undefined>(initialProgram?.id);
  const isEditMode = !!programId;

  // Save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Snapshot of last-saved state for dirty detection (initialized once via useState)
  const [initialSnapshot] = useState(() => {
    if (initialProgram) return JSON.stringify(programResponseToForm(initialProgram));
    if (templateProgram) return JSON.stringify(templateToNewProgramForm(templateProgram));
    return JSON.stringify(createDefaultProgramForm());
  });
  const lastSavedSnapshotRef = useRef(initialSnapshot);
  // Auto-save timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent auto-save from racing with manual save
  const isSavingRef = useRef(false);

  // Compute dirty state
  const currentSnapshot = JSON.stringify(program);
  const isDirty = currentSnapshot !== lastSavedSnapshotRef.current;

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

  const duplicateExercise = useCallback((dayId: string, exerciseId: string) => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => {
          if (d.id !== dayId) return d;
          const sourceIdx = d.exercises.findIndex((ex) => ex.id === exerciseId);
          if (sourceIdx === -1) return d;
          const source = d.exercises[sourceIdx];
          const newExercise: ExerciseEntry = {
            ...source,
            id: crypto.randomUUID(),
            workoutExerciseId: undefined,
            order: d.exercises.length + 1,
          };
          return {
            ...d,
            exercises: [...d.exercises, newExercise],
          };
        }),
      })),
    }));
  }, []);

  const moveExercise = useCallback((dayId: string, exerciseId: string, direction: 'up' | 'down') => {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => {
          if (d.id !== dayId) return d;
          const idx = d.exercises.findIndex((ex) => ex.id === exerciseId);
          if (idx === -1) return d;
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= d.exercises.length) return d;
          const exercises = [...d.exercises];
          [exercises[idx], exercises[targetIdx]] = [exercises[targetIdx], exercises[idx]];
          return {
            ...d,
            exercises: exercises.map((ex, i) => ({ ...ex, order: i + 1 })),
          };
        }),
      })),
    }));
  }, []);

  const updateExercise = useCallback(
    (dayId: string, exerciseId: string, updates: Partial<ExerciseEntry>) => {
      setProgram((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, ...updates } : ex
              ),
            };
          }),
        })),
      }));
    },
    []
  );

  // ============================================================
  // Save
  // ============================================================

  const performSave = useCallback(async (currentProgram: ProgramFormState): Promise<boolean> => {
    if (!currentProgram.name.trim()) {
      setSaveError('Program name is required');
      setSaveStatus('error');
      return false;
    }

    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const payload = programFormToPayload(currentProgram, coachId);

      const url = programId
        ? `/api/programs/${programId}`
        : '/api/programs';
      const method = programId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save program (${res.status})`);
      }

      const saved = await res.json();

      // After first save of a new program, capture the ID and update the URL
      if (!programId) {
        setProgramId(saved.id);
        setProgram((prev) => ({ ...prev, id: saved.id }));
        window.history.replaceState(null, '', `/programs/${saved.id}/edit`);
      }

      // Update saved snapshot
      lastSavedSnapshotRef.current = JSON.stringify(currentProgram);
      setSaveStatus('saved');
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save program');
      setSaveStatus('error');
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [coachId, programId]);

  const handleSave = useCallback(async () => {
    // Cancel any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    await performSave(program);
  }, [program, performSave]);

  // ============================================================
  // Auto-save (2s debounce after changes)
  // ============================================================

  useEffect(() => {
    // Don't auto-save if there's nothing to save or no name yet
    if (!isDirty || !program.name.trim()) {
      if (!isDirty && saveStatus === 'dirty') setSaveStatus('saved');
      return;
    }

    // Show dirty state immediately
    if (saveStatus !== 'saving') setSaveStatus('dirty');

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new debounced save
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      performSave(program);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshot]);

  // ============================================================
  // Warn on navigation with unsaved changes
  // ============================================================

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Program' : 'New Program'}
          </h1>
          {templateProgram && (
            <p className="text-sm text-muted-foreground">
              From template: {templateProgram.name}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} error={saveError} />
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} size="sm" variant={isDirty ? 'default' : 'outline'}>
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </Button>
        </div>
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
            <Label htmlFor="program-description">
              <StickyNote className="h-3.5 w-3.5 inline mr-1" />
              Description / Notes
            </Label>
            <Textarea
              id="program-description"
              value={program.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Program description, goals, and coaching notes..."
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
              onDuplicateExercise={duplicateExercise}
              onMoveExercise={moveExercise}
              onUpdateExercise={updateExercise}
            />
          ))}
        </div>
      )}

      {/* Bottom Save */}
      {(totalWeeks > 0 || program.name) && (
        <div className="flex justify-end items-center gap-3 pt-2">
          <SaveStatusIndicator status={saveStatus} error={saveError} />
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} size="lg" variant={isDirty ? 'default' : 'outline'}>
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </Button>
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
// Save Status Indicator
// ============================================================

function SaveStatusIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  switch (status) {
    case 'saving':
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving...
        </span>
      );
    case 'saved':
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-green-600" />
          All changes saved
        </span>
      );
    case 'dirty':
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5" />
          Unsaved changes
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-sm text-destructive">
          {error || 'Save failed'}
        </span>
      );
    default:
      return null;
  }
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
  onDuplicateExercise: (dayId: string, exerciseId: string) => void;
  onMoveExercise: (dayId: string, exerciseId: string, direction: 'up' | 'down') => void;
  onUpdateExercise: (dayId: string, exerciseId: string, updates: Partial<ExerciseEntry>) => void;
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
  onDuplicateExercise,
  onMoveExercise,
  onUpdateExercise,
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
                  onDuplicateExercise={(exId) => onDuplicateExercise(day.id, exId)}
                  onMoveExercise={(exId, direction) => onMoveExercise(day.id, exId, direction)}
                  onUpdateExercise={(exId, updates) => onUpdateExercise(day.id, exId, updates)}
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
  onDuplicateExercise: (exerciseId: string) => void;
  onMoveExercise: (exerciseId: string, direction: 'up' | 'down') => void;
  onUpdateExercise: (exerciseId: string, updates: Partial<ExerciseEntry>) => void;
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
  onDuplicateExercise,
  onMoveExercise,
  onUpdateExercise,
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
            <StickyNote className="h-3.5 w-3.5 mr-1" />
            Notes
            {!showNotes && day.notes.length > 0 && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            )}
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
              {day.exercises.map((exercise, idx) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isFirst={idx === 0}
                  isLast={idx === day.exercises.length - 1}
                  onRemove={() => onRemoveExercise(exercise.id)}
                  onDuplicate={() => onDuplicateExercise(exercise.id)}
                  onMoveUp={() => onMoveExercise(exercise.id, 'up')}
                  onMoveDown={() => onMoveExercise(exercise.id, 'down')}
                  onUpdate={(updates) => onUpdateExercise(exercise.id, updates)}
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
// Exercise Row (expandable with prescription editing)
// ============================================================

interface ExerciseRowProps {
  exercise: ExerciseEntry;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<ExerciseEntry>) => void;
}

function ExerciseRow({ exercise, isFirst, isLast, onRemove, onDuplicate, onMoveUp, onMoveDown, onUpdate }: ExerciseRowProps) {
  const [expanded, setExpanded] = useState(false);
  const prescriptionSummary = formatPrescription(exercise);

  const handlePrescriptionTypeChange = (newType: PrescriptionType) => {
    onUpdate({
      prescriptionType: newType,
      prescription: createDefaultPrescription(newType),
    });
  };

  const updatePrescription = (updates: Partial<PrescriptionValues>) => {
    onUpdate({
      prescription: { ...exercise.prescription, ...updates } as PrescriptionValues,
    });
  };

  return (
    <div className="rounded-md border border-border bg-background group">
      {/* Compact Row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-4 w-5 p-0 disabled:opacity-20"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={isLast}
            className="h-4 w-5 p-0 disabled:opacity-20"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground w-5 shrink-0">{exercise.order}.</span>
        <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{exercise.exerciseName}</span>
        <Badge variant="outline" className="text-xs shrink-0 ml-auto">
          {PRESCRIPTION_TYPE_LABELS[exercise.prescriptionType]}
        </Badge>
        {prescriptionSummary && (
          <span className="text-xs text-muted-foreground shrink-0">{prescriptionSummary}</span>
        )}
        {!expanded && exercise.notes.length > 0 && (
          <span className="shrink-0 text-muted-foreground" title={exercise.notes}>
            <StickyNote className="h-3.5 w-3.5" />
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'h-6 w-6 p-0 shrink-0 transition-colors',
            expanded ? 'text-primary' : 'opacity-0 group-hover:opacity-100'
          )}
          title="Edit prescription"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Duplicate exercise"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded Prescription Editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
          {/* Prescription Type + Sets/Reps (always shown) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prescription Type</Label>
              <select
                value={exercise.prescriptionType}
                onChange={(e) => handlePrescriptionTypeChange(e.target.value as PrescriptionType)}
                className={cn(SELECT_CLASS, 'h-8 text-xs')}
              >
                {(Object.entries(PRESCRIPTION_TYPE_LABELS) as [PrescriptionType, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sets</Label>
              <Input
                value={exercise.prescription.sets}
                onChange={(e) => updatePrescription({ sets: e.target.value })}
                placeholder="3"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                value={exercise.prescription.reps}
                onChange={(e) => updatePrescription({ reps: e.target.value })}
                placeholder="5"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          <PrescriptionFields
            prescription={exercise.prescription}
            onUpdate={updatePrescription}
          />

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              <StickyNote className="h-3 w-3 inline mr-1" />
              Exercise Notes
            </Label>
            <Textarea
              value={exercise.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="e.g. Pause 2 sec at bottom, keep elbows tucked"
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Prescription Fields (type-specific inputs)
// ============================================================

interface PrescriptionFieldsProps {
  prescription: PrescriptionValues;
  onUpdate: (updates: Partial<PrescriptionValues>) => void;
}

function PrescriptionFields({ prescription, onUpdate }: PrescriptionFieldsProps) {
  switch (prescription.type) {
    case 'percentage':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">% of 1RM</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={prescription.percentage ?? ''}
                  onChange={(e) =>
                    onUpdate({ percentage: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="80"
                  min={0}
                  max={120}
                  step={2.5}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground shrink-0">%</span>
              </div>
            </div>
          </div>
          {prescription.percentage != null && (
            <p className="text-xs text-muted-foreground">
              Athlete works at {prescription.percentage}% of their current 1RM
            </p>
          )}
        </div>
      );

    case 'rpe':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">RPE (min)</Label>
              <Input
                type="number"
                value={prescription.rpe ?? ''}
                onChange={(e) =>
                  onUpdate({ rpe: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="7"
                min={1}
                max={10}
                step={0.5}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">RPE (max, optional)</Label>
              <Input
                type="number"
                value={prescription.rpeMax ?? ''}
                onChange={(e) =>
                  onUpdate({ rpeMax: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="8"
                min={1}
                max={10}
                step={0.5}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Load (optional)</Label>
              <Input
                value={prescription.load}
                onChange={(e) => onUpdate({ load: e.target.value })}
                placeholder="e.g. 315 lbs"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <RPEHint rpe={prescription.rpe} rpeMax={prescription.rpeMax} />
        </div>
      );

    case 'rir':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reps in Reserve</Label>
              <Input
                type="number"
                value={prescription.rir ?? ''}
                onChange={(e) =>
                  onUpdate({ rir: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="2"
                min={0}
                max={10}
                step={1}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Load (optional)</Label>
              <Input
                value={prescription.load}
                onChange={(e) => onUpdate({ load: e.target.value })}
                placeholder="e.g. 225 lbs"
                className="h-8 text-xs"
              />
            </div>
          </div>
          {prescription.rir != null && (
            <p className="text-xs text-muted-foreground">
              {prescription.rir} RIR = RPE {10 - prescription.rir}
              {prescription.rir === 0 && ' (max effort)'}
              {prescription.rir === 1 && ' (could do 1 more)'}
              {prescription.rir === 2 && ' (could do 2 more)'}
              {prescription.rir === 3 && ' (moderate effort)'}
              {prescription.rir >= 4 && ' (light effort)'}
            </p>
          )}
        </div>
      );

    case 'velocity':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Velocity Target (m/s)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={prescription.velocityTarget ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      velocityTarget: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="0.8"
                  min={0}
                  max={3}
                  step={0.05}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground shrink-0">m/s</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Load (optional)</Label>
              <Input
                value={prescription.load}
                onChange={(e) => onUpdate({ load: e.target.value })}
                placeholder="e.g. 275 lbs"
                className="h-8 text-xs"
              />
            </div>
          </div>
          {prescription.velocityTarget != null && (
            <p className="text-xs text-muted-foreground">
              {prescription.velocityTarget >= 1.0 && 'Speed/power zone'}
              {prescription.velocityTarget >= 0.75 && prescription.velocityTarget < 1.0 && 'Strength-speed zone'}
              {prescription.velocityTarget >= 0.5 && prescription.velocityTarget < 0.75 && 'Strength zone'}
              {prescription.velocityTarget > 0 && prescription.velocityTarget < 0.5 && 'Max strength/grinding zone'}
              {' '}— stop set if velocity drops below {prescription.velocityTarget} m/s
            </p>
          )}
        </div>
      );

    case 'autoregulated':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target RPE</Label>
              <Input
                type="number"
                value={prescription.rpe ?? ''}
                onChange={(e) =>
                  onUpdate({ rpe: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="8"
                min={1}
                max={10}
                step={0.5}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">RPE max (opt.)</Label>
              <Input
                type="number"
                value={prescription.rpeMax ?? ''}
                onChange={(e) =>
                  onUpdate({ rpeMax: e.target.value ? Number(e.target.value) : null })
                }
                placeholder=""
                min={1}
                max={10}
                step={0.5}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Backoff %</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={prescription.backoffPercent ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      backoffPercent: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="10"
                  min={0}
                  max={50}
                  step={5}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Backoff Sets</Label>
              <Input
                type="number"
                value={prescription.backoffSets ?? ''}
                onChange={(e) =>
                  onUpdate({
                    backoffSets: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="3"
                min={0}
                max={20}
                step={1}
                className="h-8 text-xs"
              />
            </div>
          </div>
          {prescription.rpe != null && (() => {
            const fmtRir = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);
            const rirStr = prescription.rpeMax != null
              ? ` / ${fmtRir(10 - prescription.rpeMax)}-${fmtRir(10 - prescription.rpe)} RIR`
              : ` / ${fmtRir(10 - prescription.rpe)} RIR`;
            return (
              <p className="text-xs text-muted-foreground font-medium">
                Work up to RPE {prescription.rpe}{prescription.rpeMax != null ? `-${prescription.rpeMax}` : ''}{rirStr}
                {prescription.backoffPercent != null && prescription.backoffSets != null
                  ? `, then -${prescription.backoffPercent}% for ${prescription.backoffSets}x${prescription.reps}`
                  : prescription.backoffPercent != null
                    ? `, then -${prescription.backoffPercent}%`
                    : ''}
              </p>
            );
          })()}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Additional Instructions</Label>
            <Input
              value={prescription.instructions}
              onChange={(e) => onUpdate({ instructions: e.target.value })}
              placeholder="e.g. Work up in triples, then backoff volume"
              className="h-8 text-xs"
            />
          </div>
        </div>
      );

    case 'fixed':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Load</Label>
              <Input
                value={prescription.load}
                onChange={(e) => onUpdate({ load: e.target.value })}
                placeholder="185"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <select
                value={prescription.unit}
                onChange={(e) => onUpdate({ unit: e.target.value as 'lbs' | 'kg' })}
                className={cn(SELECT_CLASS, 'h-8 text-xs')}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          {prescription.load && (
            <p className="text-xs text-muted-foreground">
              Fixed at {prescription.load} {prescription.unit} for all sets
            </p>
          )}
        </div>
      );
  }
}

/** RPE hint text showing description for the selected RPE value/range */
function RPEHint({ rpe, rpeMax }: { rpe: number | null; rpeMax: number | null }) {
  if (rpe == null) return null;

  const rpeDescription = (value: number): string => {
    if (value >= 10) return 'max effort, no reps left';
    if (value >= 9.5) return 'could maybe do 1 more';
    if (value >= 9) return 'could do 1 more';
    if (value >= 8.5) return 'could definitely do 1, maybe 2';
    if (value >= 8) return 'could do 2 more';
    if (value >= 7.5) return 'could do 2-3 more';
    if (value >= 7) return 'could do 3 more';
    if (value >= 6.5) return 'could do 3-4 more';
    if (value >= 6) return 'could do 4 more';
    return 'light effort';
  };

  const fmtRir = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);
  const display = rpeMax != null
    ? `RPE ${rpe}-${rpeMax} / ${fmtRir(10 - rpeMax)}-${fmtRir(10 - rpe)} RIR: ${rpeDescription(rpe)} to ${rpeDescription(rpeMax)}`
    : `RPE ${rpe} / ${fmtRir(10 - rpe)} RIR: ${rpeDescription(rpe)}`;

  return <p className="text-xs text-muted-foreground">{display}</p>;
}

// ============================================================
// Helpers
// ============================================================

function formatPrescription(exercise: ExerciseEntry): string {
  const p = exercise.prescription;
  const setsReps = `${p.sets}x${p.reps}`;
  const fmtRir = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  switch (p.type) {
    case 'percentage':
      return p.percentage ? `${setsReps} @ ${p.percentage}%` : setsReps;
    case 'rpe': {
      if (p.rpe == null) return setsReps;
      const rpeStr = p.rpeMax != null
        ? `RPE ${p.rpe}-${p.rpeMax} / ${fmtRir(10 - p.rpeMax)}-${fmtRir(10 - p.rpe)} RIR`
        : `RPE ${p.rpe} / ${fmtRir(10 - p.rpe)} RIR`;
      return `${setsReps} @ ${rpeStr}`;
    }
    case 'rir':
      return p.rir != null ? `${setsReps} @ ${p.rir} RIR / RPE ${10 - p.rir}` : setsReps;
    case 'velocity':
      return p.velocityTarget ? `${setsReps} @ ${p.velocityTarget} m/s` : setsReps;
    case 'autoregulated': {
      if (p.rpe == null) return p.instructions || setsReps;
      const rpeLabel = p.rpeMax != null
        ? `RPE ${p.rpe}-${p.rpeMax} / ${fmtRir(10 - p.rpeMax)}-${fmtRir(10 - p.rpe)} RIR`
        : `RPE ${p.rpe} / ${fmtRir(10 - p.rpe)} RIR`;
      let result = `Work up to ${rpeLabel}`;
      if (p.backoffPercent != null && p.backoffSets != null) {
        result += `, then -${p.backoffPercent}% x${p.backoffSets}`;
      }
      return result;
    }
    case 'fixed':
      return p.load ? `${setsReps} @ ${p.load} ${p.unit}` : setsReps;
  }
}
