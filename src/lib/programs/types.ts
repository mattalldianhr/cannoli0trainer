/**
 * TypeScript types for the program builder editing state.
 *
 * These types represent the client-side state used while building/editing
 * a program. They map to (but are not identical to) the Prisma models:
 * Program, Workout, WorkoutExercise.
 *
 * Prisma enums are re-exported from @prisma/client for consistency.
 */

import type {
  PrescriptionType,
  ProgramType,
  PeriodizationType,
  WeightUnit,
} from '@prisma/client';

// Re-export Prisma enums for convenience
export type { PrescriptionType, ProgramType, PeriodizationType, WeightUnit };

// ============================================================
// Program builder state (client-side editing)
// ============================================================

/** Top-level program being edited in the builder */
export interface ProgramFormState {
  id?: string;
  name: string;
  description: string;
  type: ProgramType;
  periodizationType: PeriodizationType | null;
  isTemplate: boolean;
  weeks: WeekState[];
}

/** A single week within a program */
export interface WeekState {
  /** Client-generated ID for tracking during editing (UUID or temp ID) */
  id: string;
  weekNumber: number;
  days: DayState[];
}

/** A single training day within a week */
export interface DayState {
  /** Client-generated ID for tracking during editing */
  id: string;
  /** Persisted Workout ID if saved to database */
  workoutId?: string;
  dayNumber: number;
  name: string;
  notes: string;
  exercises: ExerciseEntry[];
}

/** An exercise entry within a day, with its prescription */
export interface ExerciseEntry {
  /** Client-generated ID for tracking during editing */
  id: string;
  /** Persisted WorkoutExercise ID if saved to database */
  workoutExerciseId?: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  prescriptionType: PrescriptionType;
  prescription: PrescriptionValues;
  supersetGroup: string | null;
  supersetColor: string | null;
  isUnilateral: boolean;
  restTimeSeconds: number | null;
  tempo: string | null;
  notes: string;
}

// ============================================================
// Prescription values per type
// ============================================================

/**
 * Union of all prescription value shapes.
 * The active shape depends on ExerciseEntry.prescriptionType.
 */
export type PrescriptionValues =
  | PercentagePrescription
  | RPEPrescription
  | RIRPrescription
  | VelocityPrescription
  | AutoregulatedPrescription
  | FixedPrescription;

/** Percentage of 1RM — e.g. "4x3 @ 80%" */
export interface PercentagePrescription {
  type: 'percentage';
  sets: string;
  reps: string;
  percentage: number | null;
}

/** RPE-based — e.g. "3x5 @ RPE 8" */
export interface RPEPrescription {
  type: 'rpe';
  sets: string;
  reps: string;
  rpe: number | null;
  load: string;
}

/** RIR-based — e.g. "3x8 @ 2 RIR" */
export interface RIRPrescription {
  type: 'rir';
  sets: string;
  reps: string;
  rir: number | null;
  load: string;
}

/** Velocity target — e.g. "5x3 @ 0.8 m/s" */
export interface VelocityPrescription {
  type: 'velocity';
  sets: string;
  reps: string;
  velocityTarget: number | null;
  load: string;
}

/** Autoregulated — e.g. "Work up to RPE 8, then -10% x3" */
export interface AutoregulatedPrescription {
  type: 'autoregulated';
  sets: string;
  reps: string;
  rpe: number | null;
  backoffPercent: number | null;
  backoffSets: number | null;
  instructions: string;
}

/** Fixed weight / progressive overload — e.g. "4x6 @ 185 lbs" */
export interface FixedPrescription {
  type: 'fixed';
  sets: string;
  reps: string;
  load: string;
  unit: WeightUnit;
}

// ============================================================
// Helpers
// ============================================================

/** Labels for prescription type dropdown */
export const PRESCRIPTION_TYPE_LABELS: Record<PrescriptionType, string> = {
  percentage: '% of 1RM',
  rpe: 'RPE',
  rir: 'RIR',
  velocity: 'Velocity',
  autoregulated: 'Autoregulated',
  fixed: 'Fixed Weight',
} as const;

/** Labels for periodization type dropdown */
export const PERIODIZATION_TYPE_LABELS: Record<PeriodizationType, string> = {
  block: 'Block',
  dup: 'DUP',
  linear: 'Linear',
  rpe_based: 'RPE-Based',
  hybrid: 'Hybrid',
} as const;

/** Labels for program type */
export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  individual: 'Individual',
  template: 'Template',
  group: 'Group',
} as const;

/** Create a default empty prescription for a given type */
export function createDefaultPrescription(type: PrescriptionType): PrescriptionValues {
  switch (type) {
    case 'percentage':
      return { type: 'percentage', sets: '3', reps: '5', percentage: null };
    case 'rpe':
      return { type: 'rpe', sets: '3', reps: '5', rpe: null, load: '' };
    case 'rir':
      return { type: 'rir', sets: '3', reps: '8', rir: null, load: '' };
    case 'velocity':
      return { type: 'velocity', sets: '5', reps: '3', velocityTarget: null, load: '' };
    case 'autoregulated':
      return {
        type: 'autoregulated',
        sets: '1',
        reps: '1',
        rpe: null,
        backoffPercent: null,
        backoffSets: null,
        instructions: '',
      };
    case 'fixed':
      return { type: 'fixed', sets: '3', reps: '5', load: '', unit: 'lbs' };
  }
}

/** Create a default empty exercise entry */
export function createDefaultExerciseEntry(
  exerciseId: string,
  exerciseName: string,
  order: number,
  clientId: string,
): ExerciseEntry {
  return {
    id: clientId,
    exerciseId,
    exerciseName,
    order,
    prescriptionType: 'fixed',
    prescription: createDefaultPrescription('fixed'),
    supersetGroup: null,
    supersetColor: null,
    isUnilateral: false,
    restTimeSeconds: null,
    tempo: null,
    notes: '',
  };
}

/** Create a default empty day */
export function createDefaultDay(dayNumber: number, clientId: string): DayState {
  return {
    id: clientId,
    dayNumber,
    name: `Day ${dayNumber}`,
    notes: '',
    exercises: [],
  };
}

/** Create a default empty week */
export function createDefaultWeek(weekNumber: number, clientId: string): WeekState {
  return {
    id: clientId,
    weekNumber,
    days: [],
  };
}

/** Create a default empty program form state */
export function createDefaultProgramForm(): ProgramFormState {
  return {
    name: '',
    description: '',
    type: 'individual',
    periodizationType: null,
    isTemplate: false,
    weeks: [],
  };
}

// ============================================================
// API payload types (for save/load)
// ============================================================

/** Payload sent to POST/PUT /api/programs */
export interface ProgramSavePayload {
  name: string;
  description?: string;
  type: ProgramType;
  periodizationType?: PeriodizationType | null;
  isTemplate: boolean;
  coachId: string;
  workouts: WorkoutSavePayload[];
}

/** Workout within a save payload */
export interface WorkoutSavePayload {
  id?: string;
  name: string;
  dayNumber: number;
  weekNumber: number;
  notes?: string;
  exercises: WorkoutExerciseSavePayload[];
}

/** Exercise within a workout save payload */
export interface WorkoutExerciseSavePayload {
  id?: string;
  exerciseId: string;
  order: number;
  prescriptionType: PrescriptionType;
  prescribedSets?: string;
  prescribedReps?: string;
  prescribedLoad?: string;
  prescribedRPE?: number;
  prescribedRIR?: number;
  velocityTarget?: number;
  percentageOf1RM?: number;
  supersetGroup?: string;
  supersetColor?: string;
  isUnilateral?: boolean;
  restTimeSeconds?: number;
  tempo?: string;
  notes?: string;
}

/** Shape of program data returned from GET /api/programs/[id] */
export interface ProgramWithDetails {
  id: string;
  coachId: string;
  name: string;
  description: string | null;
  type: ProgramType;
  periodizationType: PeriodizationType | null;
  isTemplate: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  workouts: WorkoutWithExercises[];
  assignments: ProgramAssignmentData[];
}

/** Workout with nested exercises from API response */
export interface WorkoutWithExercises {
  id: string;
  name: string;
  dayNumber: number;
  weekNumber: number;
  notes: string | null;
  exercises: WorkoutExerciseData[];
}

/** Exercise data from API response */
export interface WorkoutExerciseData {
  id: string;
  exerciseId: string;
  order: number;
  prescriptionType: PrescriptionType;
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
  };
}

/** Program assignment data from API response */
export interface ProgramAssignmentData {
  id: string;
  athleteId: string;
  assignedAt: string;
  startDate: string | null;
  endDate: string | null;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
