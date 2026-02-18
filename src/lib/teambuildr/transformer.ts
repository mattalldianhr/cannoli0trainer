/**
 * TeamBuildr data transformer.
 *
 * Transforms TeamBuildr export JSON into Cannoli Trainer database records.
 * Used by the import seed script (Task 2.4/2.5) to populate the database
 * with real coaching data.
 *
 * Key mapping decisions:
 *   - `value` field = actual recorded data (what the athlete logged)
 *   - `placeholder` field = prescribed/expected data (what the coach programmed)
 *   - `percentage` field = %1RM when percentage-based programming is used
 *   - RPE is extracted from `additionalInformation` free text
 *   - Non-exercise items (Notes, Surveys) are skipped for SetLog creation
 *   - All weights are in kilograms (account-level setting)
 */

import type {
  TeamBuildrExport,
  AthleteExport,
  WorkoutItem,
  SetData,
  ExerciseTypeCode,
  MaxData,
} from './types';
import {
  resolveTeambuildrExerciseName,
  teambuildrNonExercises,
} from '../../../prisma/seed-data/exercise-tags';

// ============================================================
// Output types (ready for Prisma creates)
// ============================================================

export interface TransformedAthlete {
  tbId: number;
  name: string;
  email?: string;
  groupAssignments: string[];
}

export interface TransformedSession {
  athleteTbId: number;
  date: string;
  title: string | null;
  durationSeconds: number;
  status: 'NOT_STARTED' | 'PARTIALLY_COMPLETED' | 'FULLY_COMPLETED';
  completionPercentage: number;
  completedItems: number;
  totalItems: number;
}

export interface TransformedWorkoutExercise {
  athleteTbId: number;
  date: string;
  exerciseName: string;
  tbExerciseId: number;
  order: number;
  prescriptionType: 'percentage' | 'rpe' | 'fixed';
  prescribedSets: string | null;
  prescribedReps: string | null;
  prescribedLoad: string | null;
  prescribedRPE: number | null;
  percentageOf1RM: number | null;
  supersetGroup: string | null;
  supersetColor: string | null;
  isUnilateral: boolean;
  restTimeSeconds: number | null;
  tempo: string | null;
  notes: string | null;
  sets: TransformedSet[];
}

export interface TransformedSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number | null;
  velocity: number | null;
  prescribedReps: number | null;
  prescribedWeight: number | null;
  percentageOf1RM: number | null;
}

export interface TransformedMaxSnapshot {
  athleteTbId: number;
  tbExerciseId: number;
  exerciseName: string;
  date: string;
  workingMax: number;
  generatedMax: number | null;
  isCurrentMax: boolean;
  source: 'WORKOUT' | 'IMPORT';
}

export interface TransformResult {
  athletes: TransformedAthlete[];
  sessions: TransformedSession[];
  workoutExercises: TransformedWorkoutExercise[];
  maxSnapshots: TransformedMaxSnapshot[];
  stats: TransformStats;
}

export interface TransformStats {
  totalDates: number;
  totalWorkoutItems: number;
  totalLiftItems: number;
  totalSets: number;
  totalMaxSnapshots: number;
  skippedNonExercises: number;
  skippedNoData: number;
  athleteStats: Record<string, {
    dates: number;
    workoutItems: number;
    liftItems: number;
    sets: number;
    maxSnapshots: number;
  }>;
}

// ============================================================
// Main transform function
// ============================================================

export function transformTeamBuildrExport(data: TeamBuildrExport): TransformResult {
  const athletes: TransformedAthlete[] = [];
  const sessions: TransformedSession[] = [];
  const workoutExercises: TransformedWorkoutExercise[] = [];
  const maxSnapshots: TransformedMaxSnapshot[] = [];
  const stats: TransformStats = {
    totalDates: 0,
    totalWorkoutItems: 0,
    totalLiftItems: 0,
    totalSets: 0,
    totalMaxSnapshots: 0,
    skippedNonExercises: 0,
    skippedNoData: 0,
    athleteStats: {},
  };

  for (const [athleteName, athleteData] of Object.entries(data.athletes)) {
    const athlete = transformAthlete(athleteData);
    athletes.push(athlete);

    const athleteStats = { dates: 0, workoutItems: 0, liftItems: 0, sets: 0, maxSnapshots: 0 };

    for (const [date, workoutDay] of Object.entries(athleteData.workouts)) {
      athleteStats.dates++;

      // Transform session
      const overview = athleteData.workoutOverview?.find(o => o.date === date);
      const summary = athleteData.summaries?.[date];
      const session = transformSession(
        athlete.tbId,
        date,
        workoutDay,
        overview,
        summary,
      );
      sessions.push(session);

      // Transform workout items
      let order = 0;
      for (const item of workoutDay.workoutItems) {
        athleteStats.workoutItems++;

        // Skip non-exercises (notes, surveys)
        if (isNonExercise(item)) {
          stats.skippedNonExercises++;
          continue;
        }

        order++;
        const transformed = transformWorkoutExercise(athlete.tbId, date, item, order);

        if (transformed) {
          workoutExercises.push(transformed);
          athleteStats.liftItems++;
          athleteStats.sets += transformed.sets.length;
        } else {
          stats.skippedNoData++;
        }

        // Transform max snapshots
        const maxes = transformMaxSnapshots(athlete.tbId, date, item);
        for (const max of maxes) {
          maxSnapshots.push(max);
          athleteStats.maxSnapshots++;
        }
      }
    }

    stats.athleteStats[athleteName] = athleteStats;
    stats.totalDates += athleteStats.dates;
    stats.totalWorkoutItems += athleteStats.workoutItems;
    stats.totalLiftItems += athleteStats.liftItems;
    stats.totalSets += athleteStats.sets;
    stats.totalMaxSnapshots += athleteStats.maxSnapshots;
  }

  return { athletes, sessions, workoutExercises, maxSnapshots, stats };
}

// ============================================================
// Individual transformers
// ============================================================

function transformAthlete(data: AthleteExport): TransformedAthlete {
  const first = data.profile.first.trim();
  const last = data.profile.last.trim();
  return {
    tbId: data.profile.id,
    name: `${first} ${last}`,
    email: data.profile.email,
    groupAssignments: (data.profile.groupAssignments || []).map(g => g.name),
  };
}

function transformSession(
  athleteTbId: number,
  date: string,
  workoutDay: AthleteExport['workouts'][string],
  overview: AthleteExport['workoutOverview'][number] | undefined,
  summary: AthleteExport['summaries'][string] | undefined,
): TransformedSession {
  // Prefer summary for duration (more accurate), fall back to workoutDay
  const durationSeconds = summary?.sessionDurationInSeconds
    ?? workoutDay.sessionDurationInSeconds
    ?? 0;

  // Calculate completion from overview or count items
  const totalItems = overview?.totalItems ?? workoutDay.workoutItems.length;
  const completedItems = overview?.completedItems
    ?? workoutDay.workoutItems.filter(i => i.fullyCompleted).length;
  const completionPercentage = overview?.completionPercentage
    ?? (totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

  let status: TransformedSession['status'] = 'NOT_STARTED';
  if (overview?.statusDescription === 'FULLY_COMPLETED' || completionPercentage === 100) {
    status = 'FULLY_COMPLETED';
  } else if (completedItems > 0 || (overview?.statusDescription === 'PARTIALLY_COMPLETED')) {
    status = 'PARTIALLY_COMPLETED';
  }

  return {
    athleteTbId,
    date,
    title: workoutDay.title,
    durationSeconds,
    status,
    completionPercentage,
    completedItems,
    totalItems,
  };
}

function transformWorkoutExercise(
  athleteTbId: number,
  date: string,
  item: WorkoutItem,
  order: number,
): TransformedWorkoutExercise | null {
  const exerciseName = resolveTeambuildrExerciseName(item.exercise.name);

  // Determine prescription type
  const prescriptionType = determinePrescriptionType(item);

  // Extract prescribed values from first set's placeholders
  const prescribedInfo = extractPrescribedInfo(item);

  // Extract RPE from additionalInformation
  const parsedRPE = parseRPE(item.additionalInformation);

  // Extract tempo from additionalInformation
  const tempo = parseTempo(item.additionalInformation);

  // Extract rest time from set data
  const restTimeSeconds = extractRestTime(item);

  // Transform sets - only for items with actual data (Lifts, SAQ+C, Circuits, Warm-ups)
  const sets = transformSets(item, parsedRPE);

  // Skip items with no meaningful set data (e.g., checkbox-only warm-ups)
  if (sets.length === 0 && !isLiftType(item.type)) {
    return null;
  }

  return {
    athleteTbId,
    date,
    exerciseName,
    tbExerciseId: item.exercise.id,
    order,
    prescriptionType,
    prescribedSets: prescribedInfo.sets,
    prescribedReps: prescribedInfo.reps,
    prescribedLoad: prescribedInfo.load,
    prescribedRPE: parsedRPE,
    percentageOf1RM: prescribedInfo.percentage,
    supersetGroup: item.groupingLetter,
    supersetColor: item.groupingColorCode,
    isUnilateral: item.eachSide,
    restTimeSeconds,
    tempo,
    notes: item.additionalInformation,
    sets,
  };
}

function transformSets(item: WorkoutItem, prescribedRPE: number | null): TransformedSet[] {
  if (!item.tableData || item.tableData.length === 0) return [];

  const sets: TransformedSet[] = [];

  for (const setData of item.tableData) {
    const set = transformSet(setData, prescribedRPE);
    if (set) {
      sets.push(set);
    }
  }

  return sets;
}

function transformSet(setData: SetData, prescribedRPE: number | null): TransformedSet | null {
  const weightVal = findSetValue(setData, 'primary1');
  const repsVal = findSetValue(setData, 'reps');
  const velocityVal = findSetValue(setData, 'peakVelocity')
    ?? findSetValue(setData, 'meanVelocity')
    ?? findSetValue(setData, 'velocity');

  // actual = value field, prescribed = placeholder field
  const actualWeight = weightVal?.value ?? 0;
  const actualReps = repsVal?.value ?? 0;

  // Skip sets with no actual data (0 weight AND 0 reps means not completed)
  if (actualWeight === 0 && actualReps === 0) {
    // Check if there's prescribed data - if so, it's an incomplete set
    const prescribedWeight = parseFloat(weightVal?.placeholder ?? '0') || 0;
    const prescribedReps = parseInt(repsVal?.placeholder ?? '0', 10) || 0;
    if (prescribedWeight === 0 && prescribedReps === 0) {
      return null;
    }
    // If there's a prescription but no completion, still skip (not completed)
    return null;
  }

  return {
    setNumber: setData.setId,
    reps: actualReps,
    weight: actualWeight,
    rpe: prescribedRPE,
    velocity: velocityVal?.value ?? null,
    prescribedReps: parseInt(repsVal?.placeholder ?? '0', 10) || null,
    prescribedWeight: parseFloat(weightVal?.placeholder ?? '0') || null,
    percentageOf1RM: setData.percentage ?? null,
  };
}

function transformMaxSnapshots(
  athleteTbId: number,
  date: string,
  item: WorkoutItem,
): TransformedMaxSnapshot[] {
  if (!item.maxTrackingEnabled) return [];

  const snapshots: TransformedMaxSnapshot[] = [];
  const exerciseName = resolveTeambuildrExerciseName(item.exercise.name);

  // Working max snapshot
  if (item.workingMax && item.workingMax.rawValue > 0) {
    snapshots.push({
      athleteTbId,
      tbExerciseId: item.exercise.id,
      exerciseName,
      date: item.workingMax.dateSet,
      workingMax: item.workingMax.rawValue,
      generatedMax: null,
      isCurrentMax: item.workingMax.isCurrentMax,
      source: 'IMPORT',
    });
  }

  // Generated max snapshot (new PR from this session)
  if (item.generatedMax && item.generatedMax.rawValue > 0) {
    snapshots.push({
      athleteTbId,
      tbExerciseId: item.exercise.id,
      exerciseName,
      date: item.generatedMax.dateSet,
      workingMax: item.workingMax?.rawValue ?? item.generatedMax.rawValue,
      generatedMax: item.generatedMax.rawValue,
      isCurrentMax: item.generatedMax.isCurrentMax,
      source: 'WORKOUT',
    });
  }

  return snapshots;
}

// ============================================================
// Helper functions
// ============================================================

function isNonExercise(item: WorkoutItem): boolean {
  return teambuildrNonExercises.has(item.exercise.name)
    || item.type === 'N'
    || item.type === 'Sc';
}

function isLiftType(type: ExerciseTypeCode): boolean {
  return type === 'L';
}

function determinePrescriptionType(item: WorkoutItem): 'percentage' | 'rpe' | 'fixed' {
  // Check if any set has percentage
  const hasPercentage = item.tableData?.some(s => s.percentage != null && s.percentage > 0);
  if (hasPercentage) return 'percentage';

  // Check for RPE in additional info
  const rpe = parseRPE(item.additionalInformation);
  if (rpe !== null) return 'rpe';

  return 'fixed';
}

/** Extract RPE from free text like "RPE 8", "RPE 6-7", "rpe 8.5" */
export function parseRPE(text: string | null): number | null {
  if (!text) return null;

  // Match range like "RPE 6-7" first - take the higher value
  const rangeMatch = text.match(/[Rr][Pp][Ee]\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const val = parseFloat(rangeMatch[2]);
    if (val >= 1 && val <= 10) return val;
  }

  // Match single value like "RPE 8", "RPE 8.5", "@RPE8", "rpe8"
  const match = text.match(/[Rr][Pp][Ee]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    if (val >= 1 && val <= 10) return val;
  }

  return null;
}

/** Extract tempo notation from free text like "3-1-0 tempo", "(3-2-0 Tempo)" */
export function parseTempo(text: string | null): string | null {
  if (!text) return null;

  // Match patterns like "3-1-0", "3-2-0", "2-2-2" near the word "tempo"
  const match = text.match(/(\d+-\d+-\d+(?:-\d+)?)\s*[Tt]empo/i);
  if (match) return match[1];

  // Also check for "tempo" before the numbers
  const match2 = text.match(/[Tt]empo\s*(\d+-\d+-\d+(?:-\d+)?)/i);
  if (match2) return match2[1];

  return null;
}

function extractRestTime(item: WorkoutItem): number | null {
  // Check if any set has restInSeconds
  for (const set of (item.tableData || [])) {
    if (set.restInSeconds != null && set.restInSeconds > 0) {
      return set.restInSeconds;
    }
  }
  return null;
}

function extractPrescribedInfo(item: WorkoutItem): {
  sets: string | null;
  reps: string | null;
  load: string | null;
  percentage: number | null;
} {
  if (!item.tableData || item.tableData.length === 0) {
    return { sets: null, reps: null, load: null, percentage: null };
  }

  const setCount = item.tableData.length;

  // Get prescribed reps from first set's placeholder
  const firstSet = item.tableData[0];
  const repsVal = findSetValue(firstSet, 'reps');
  const weightVal = findSetValue(firstSet, 'primary1');

  // Check if all sets have the same prescription
  const prescribedReps = repsVal?.placeholder ?? null;
  const prescribedLoad = weightVal?.placeholder ?? null;
  const percentage = firstSet.percentage ?? null;

  return {
    sets: String(setCount),
    reps: prescribedReps,
    load: prescribedLoad,
    percentage,
  };
}

function findSetValue(set: SetData, valueName: string): SetData['values'][number] | undefined {
  return set.values.find(v => v.valueName === valueName);
}

// ============================================================
// Deduplication helper for max snapshots
// ============================================================

/**
 * Deduplicate max snapshots by (athleteTbId, exerciseName, date).
 * Keeps the snapshot with the highest workingMax value for each key.
 * This is necessary because the same max can appear on multiple
 * workout dates (workingMax is carried forward until a new max is set).
 */
export function deduplicateMaxSnapshots(
  snapshots: TransformedMaxSnapshot[],
): TransformedMaxSnapshot[] {
  const map = new Map<string, TransformedMaxSnapshot>();

  for (const snap of snapshots) {
    const key = `${snap.athleteTbId}:${snap.exerciseName}:${snap.date}`;
    const existing = map.get(key);
    if (!existing || snap.workingMax > existing.workingMax) {
      map.set(key, snap);
    }
  }

  return Array.from(map.values());
}
