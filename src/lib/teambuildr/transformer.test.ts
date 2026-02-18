/**
 * Unit tests for TeamBuildr data transformer.
 *
 * Tests verify:
 * - prescribed (placeholder) vs actual (value) extraction
 * - superset grouping mapping
 * - exercise type code mapping (L→Lift, S→SAQ+C, etc.)
 * - workingMax/generatedMax → MaxSnapshot conversion
 * - RPE extraction from additionalInformation
 * - session status calculation
 * - non-exercise skipping (Notes, Surveys)
 * - deduplication of max snapshots
 *
 * Uses realistic sample data matching TeamBuildr export structure.
 */

import { describe, it, expect } from 'vitest';
import {
  transformTeamBuildrExport,
  parseRPE,
  parseTempo,
  deduplicateMaxSnapshots,
  type TransformedMaxSnapshot,
} from './transformer';
import type {
  TeamBuildrExport,
  WorkoutItem,
  SetData,
  ExerciseTypeCode,
} from './types';

// ============================================================
// Helper factories for building realistic test data
// ============================================================

function makeSetValue(
  valueName: string,
  value: number | null,
  placeholder: string | null = null,
  valueType: 'FLOAT' | 'INTEGER' = 'FLOAT',
) {
  return {
    placeholder,
    readOnly: false,
    timerEnabled: false,
    value,
    valueDescription: valueName === 'primary1' ? 'Weight' : 'Reps',
    valueName,
    valueType,
  };
}

function makeSetData(
  setId: number,
  weight: number | null,
  reps: number | null,
  opts: {
    prescribedWeight?: string;
    prescribedReps?: string;
    percentage?: number | null;
    restInSeconds?: number | null;
  } = {},
): SetData {
  return {
    setId,
    values: [
      makeSetValue('primary1', weight, opts.prescribedWeight ?? null),
      makeSetValue('reps', reps, opts.prescribedReps ?? null, 'INTEGER'),
    ],
    percentage: opts.percentage ?? null,
    restInSeconds: opts.restInSeconds ?? null,
    isActiveSet: true,
  };
}

function makeWorkoutItem(
  overrides: Partial<WorkoutItem> & {
    exerciseName?: string;
    exerciseId?: number;
    exerciseType?: ExerciseTypeCode;
  } = {},
): WorkoutItem {
  const {
    exerciseName = 'Back Squat',
    exerciseId = 1001,
    exerciseType = 'L',
    ...rest
  } = overrides;

  return {
    assignedId: 1,
    completionId: 1,
    exercise: {
      id: exerciseId,
      name: exerciseName,
      type: exerciseType,
      typeDescription: exerciseType === 'L' ? 'LIFT' : 'SAQC',
      trackingEnabled: true,
      trackingType: 4,
      trackingTypeDescription: 'Highest Entered Weight',
      description: null,
      media: null,
      documentId: null,
    },
    additionalInformation: null,
    formType: 'TwoColumns',
    icon: 'lift',
    type: exerciseType,
    typeDescription: exerciseType === 'L' ? 'LIFT' : 'SAQC',
    title: exerciseName,
    subTitle: '',
    fullyCompleted: true,
    completeableItem: true,
    completionCheckbox: false,
    completionRequired: true,
    athleteAddedItem: false,
    coachCompletionOnly: false,
    optedOut: false,
    optedOutReason: null,
    totalLoad: 0,
    totalReps: 0,
    trackingLoad: true,
    trackingRepCount: true,
    workingMax: null,
    generatedMax: null,
    maxTrackingEnabled: false,
    eachSide: false,
    groupingLetter: null,
    groupingColorCode: null,
    historyEnabled: true,
    journalEntriesEnabled: false,
    optOutEnabled: false,
    substitutionEnabled: false,
    progressionLevel: null,
    progressionMasteredInputEnabled: false,
    progressionStepMastered: false,
    tableHeaders: [
      { valueDescription: 'Weight', valueName: 'primary1' },
      { valueDescription: 'Reps', valueName: 'reps' },
    ],
    tableData: [],
    documents: [],
    journalEntries: [],
    questions: [],
    ...rest,
  };
}

function makeMinimalExport(
  athletes: Record<string, {
    profile: { id: number; first: string; last: string; email?: string };
    workouts: Record<string, { workoutItems: WorkoutItem[]; title?: string | null }>;
  }>,
): TeamBuildrExport {
  const exportData: TeamBuildrExport = {
    metadata: {
      extractedAt: '2026-02-17T00:00:00Z',
      source: 'test',
      accountId: 20731,
      athleteCount: Object.keys(athletes).length,
      totalWorkoutDates: 0,
      totalApiCalls: 0,
      errors: 0,
    },
    athletes: {},
  };

  for (const [name, data] of Object.entries(athletes)) {
    const dates = Object.keys(data.workouts);
    exportData.metadata.totalWorkoutDates += dates.length;

    exportData.athletes[name] = {
      profile: {
        id: data.profile.id,
        first: data.profile.first,
        last: data.profile.last,
        email: data.profile.email,
        pic: null,
        admin: 0,
        primaryAdmin: 0,
        gradientColors: [],
        calendarAssignment: null,
        groupAssignments: [],
      },
      dateRange: {
        first: dates[0] ?? '2025-01-01',
        last: dates[dates.length - 1] ?? '2025-01-01',
        totalDates: dates.length,
      },
      workoutOverview: [],
      workouts: Object.fromEntries(
        Object.entries(data.workouts).map(([date, workout]) => [
          date,
          {
            color: null,
            sessionDurationInSeconds: 3600,
            sessionDurationDescription: '01:00:00',
            title: workout.title ?? null,
            workoutItems: workout.workoutItems,
            assignedDayBasedProgramsData: [],
            activeDayBasedProgramsData: [],
          },
        ]),
      ),
      summaries: {},
    };
  }

  return exportData;
}

// ============================================================
// Tests: parseRPE
// ============================================================

describe('parseRPE', () => {
  it('returns null for null input', () => {
    expect(parseRPE(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseRPE('')).toBeNull();
  });

  it('returns null for text without RPE', () => {
    expect(parseRPE('Do 3 sets slowly')).toBeNull();
  });

  it('parses "RPE 8"', () => {
    expect(parseRPE('RPE 8')).toBe(8);
  });

  it('parses "rpe 8" (lowercase)', () => {
    expect(parseRPE('rpe 8')).toBe(8);
  });

  it('parses "RPE 8.5" (half values)', () => {
    expect(parseRPE('RPE 8.5')).toBe(8.5);
  });

  it('parses "RPE8" (no space)', () => {
    expect(parseRPE('RPE8')).toBe(8);
  });

  it('parses RPE from longer text', () => {
    expect(parseRPE('3 sets, RPE 7, 2 min rest')).toBe(7);
  });

  it('parses RPE range "RPE 6-7" → takes higher value', () => {
    expect(parseRPE('RPE 6-7')).toBe(7);
  });

  it('parses RPE range "RPE 7.5-8.5" → takes higher value', () => {
    expect(parseRPE('RPE 7.5-8.5')).toBe(8.5);
  });

  it('rejects RPE values outside 1-10 range', () => {
    expect(parseRPE('RPE 0')).toBeNull();
    expect(parseRPE('RPE 11')).toBeNull();
  });

  it('accepts RPE at boundaries (1 and 10)', () => {
    expect(parseRPE('RPE 1')).toBe(1);
    expect(parseRPE('RPE 10')).toBe(10);
  });
});

// ============================================================
// Tests: parseTempo
// ============================================================

describe('parseTempo', () => {
  it('returns null for null input', () => {
    expect(parseTempo(null)).toBeNull();
  });

  it('returns null for text without tempo', () => {
    expect(parseTempo('RPE 8, 3 sets')).toBeNull();
  });

  it('parses "3-1-0 tempo"', () => {
    expect(parseTempo('3-1-0 tempo')).toBe('3-1-0');
  });

  it('parses "3-2-0 Tempo" (capitalized)', () => {
    expect(parseTempo('3-2-0 Tempo')).toBe('3-2-0');
  });

  it('parses 4-count tempo "3-1-0-1 tempo"', () => {
    expect(parseTempo('3-1-0-1 tempo')).toBe('3-1-0-1');
  });

  it('parses tempo in parentheses "(3-2-0 Tempo)"', () => {
    expect(parseTempo('(3-2-0 Tempo)')).toBe('3-2-0');
  });

  it('parses "tempo 3-1-0" (tempo before numbers)', () => {
    expect(parseTempo('tempo 3-1-0')).toBe('3-1-0');
  });
});

// ============================================================
// Tests: prescribed (placeholder) vs actual (value) extraction
// ============================================================

describe('prescribed vs actual value extraction', () => {
  it('extracts actual values from value field and prescribed from placeholder', () => {
    const item = makeWorkoutItem({
      tableData: [
        makeSetData(1, 140, 5, { prescribedWeight: '130', prescribedReps: '5' }),
        makeSetData(2, 140, 5, { prescribedWeight: '130', prescribedReps: '5' }),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    const exercise = result.workoutExercises[0];
    expect(exercise.sets).toHaveLength(2);

    // Actual values
    expect(exercise.sets[0].weight).toBe(140);
    expect(exercise.sets[0].reps).toBe(5);

    // Prescribed values
    expect(exercise.sets[0].prescribedWeight).toBe(130);
    expect(exercise.sets[0].prescribedReps).toBe(5);

    // Prescribed info at the exercise level
    expect(exercise.prescribedLoad).toBe('130');
    expect(exercise.prescribedReps).toBe('5');
    expect(exercise.prescribedSets).toBe('2');
  });

  it('skips sets with no actual data (0 weight AND 0 reps)', () => {
    const item = makeWorkoutItem({
      tableData: [
        makeSetData(1, 100, 3),
        makeSetData(2, 0, 0), // not completed
        makeSetData(3, 100, 3),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].sets).toHaveLength(2);
    expect(result.workoutExercises[0].sets[0].setNumber).toBe(1);
    expect(result.workoutExercises[0].sets[1].setNumber).toBe(3);
  });
});

// ============================================================
// Tests: superset grouping mapping
// ============================================================

describe('superset grouping', () => {
  it('maps groupingLetter and groupingColorCode to supersetGroup/Color', () => {
    const item = makeWorkoutItem({
      groupingLetter: 'A',
      groupingColorCode: '#FF0000',
      tableData: [makeSetData(1, 60, 10)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    const exercise = result.workoutExercises[0];
    expect(exercise.supersetGroup).toBe('A');
    expect(exercise.supersetColor).toBe('#FF0000');
  });

  it('handles null grouping for non-supersetted exercises', () => {
    const item = makeWorkoutItem({
      groupingLetter: null,
      groupingColorCode: null,
      tableData: [makeSetData(1, 60, 10)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    const exercise = result.workoutExercises[0];
    expect(exercise.supersetGroup).toBeNull();
    expect(exercise.supersetColor).toBeNull();
  });
});

// ============================================================
// Tests: exercise type code handling
// ============================================================

describe('exercise type code handling', () => {
  it('transforms Lift (L) type exercises with set data', () => {
    const item = makeWorkoutItem({
      exerciseType: 'L',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(1);
    expect(result.workoutExercises[0].sets).toHaveLength(1);
  });

  it('transforms SAQ+C (S) type exercises with set data', () => {
    const item = makeWorkoutItem({
      exerciseName: 'Box Jumps',
      exerciseType: 'S',
      tableData: [makeSetData(1, 0, 10)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(1);
  });

  it('transforms Circuit (C) type exercises with set data', () => {
    const item = makeWorkoutItem({
      exerciseName: 'Circuit Exercise',
      exerciseType: 'C',
      tableData: [makeSetData(1, 20, 12)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(1);
  });

  it('transforms Warm-up (W) type exercises with set data', () => {
    const item = makeWorkoutItem({
      exerciseName: 'Warm Up',
      exerciseType: 'W',
      tableData: [makeSetData(1, 40, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(1);
  });

  it('skips Note (N) type items as non-exercises', () => {
    const note = makeWorkoutItem({
      exerciseName: 'Some Note',
      exerciseType: 'N',
      tableData: [],
    });
    const lift = makeWorkoutItem({
      exerciseName: 'Comp Squat',
      exerciseType: 'L',
      tableData: [makeSetData(1, 140, 3)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [note, lift] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(1);
    expect(result.stats.skippedNonExercises).toBe(1);
  });

  it('skips Survey (Sc) type items as non-exercises', () => {
    const survey = makeWorkoutItem({
      exerciseName: 'End of Block Athlete Survey',
      exerciseType: 'Sc',
      tableData: [],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [survey] } },
      },
    }));

    expect(result.workoutExercises).toHaveLength(0);
    expect(result.stats.skippedNonExercises).toBe(1);
  });
});

// ============================================================
// Tests: non-exercise skipping by name
// ============================================================

describe('non-exercise skipping by name', () => {
  it('skips items matching teambuildrNonExercises set', () => {
    const nonExercises = [
      "Coach's Note",
      'Note',
      'End of Block Athlete Survey',
      'Movement Assessment',
      'Week RPE',
      'Weekly Peaking Fatigue Assesment',
    ];

    for (const name of nonExercises) {
      const item = makeWorkoutItem({
        exerciseName: name,
        exerciseType: 'L', // even if type is L, name-based skip takes precedence
        tableData: [],
      });

      const result = transformTeamBuildrExport(makeMinimalExport({
        'Test Athlete': {
          profile: { id: 100, first: 'Test', last: 'Athlete' },
          workouts: { '2025-06-01': { workoutItems: [item] } },
        },
      }));

      expect(result.workoutExercises).toHaveLength(0);
      expect(result.stats.skippedNonExercises).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================
// Tests: prescription type determination
// ============================================================

describe('prescription type determination', () => {
  it('detects percentage-based prescription when sets have percentage field', () => {
    const item = makeWorkoutItem({
      tableData: [
        makeSetData(1, 120, 3, { percentage: 80 }),
        makeSetData(2, 125, 3, { percentage: 85 }),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].prescriptionType).toBe('percentage');
    expect(result.workoutExercises[0].percentageOf1RM).toBe(80);
  });

  it('detects RPE-based prescription from additionalInformation', () => {
    const item = makeWorkoutItem({
      additionalInformation: 'RPE 8, controlled eccentric',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].prescriptionType).toBe('rpe');
    expect(result.workoutExercises[0].prescribedRPE).toBe(8);
  });

  it('defaults to fixed prescription type when no percentage or RPE', () => {
    const item = makeWorkoutItem({
      tableData: [makeSetData(1, 60, 10, { prescribedWeight: '60', prescribedReps: '10' })],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].prescriptionType).toBe('fixed');
    expect(result.workoutExercises[0].prescribedRPE).toBeNull();
    expect(result.workoutExercises[0].percentageOf1RM).toBeNull();
  });

  it('percentage takes priority over RPE when both present', () => {
    const item = makeWorkoutItem({
      additionalInformation: 'RPE 8',
      tableData: [makeSetData(1, 120, 3, { percentage: 85 })],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].prescriptionType).toBe('percentage');
  });
});

// ============================================================
// Tests: workingMax/generatedMax → MaxSnapshot conversion
// ============================================================

describe('max snapshot conversion', () => {
  it('creates MaxSnapshot from workingMax', () => {
    const item = makeWorkoutItem({
      maxTrackingEnabled: true,
      workingMax: {
        dateSet: '2025-05-01',
        id: 5001,
        isCurrentMax: true,
        rawValue: 150,
        value: 150,
      },
      tableData: [makeSetData(1, 140, 3)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.maxSnapshots).toHaveLength(1);
    expect(result.maxSnapshots[0]).toMatchObject({
      athleteTbId: 100,
      workingMax: 150,
      generatedMax: null,
      isCurrentMax: true,
      source: 'IMPORT',
      date: '2025-05-01',
    });
  });

  it('creates MaxSnapshot from generatedMax (new PR)', () => {
    const item = makeWorkoutItem({
      maxTrackingEnabled: true,
      workingMax: {
        dateSet: '2025-05-01',
        id: 5001,
        isCurrentMax: false,
        rawValue: 150,
        value: 150,
      },
      generatedMax: {
        dateSet: '2025-06-01',
        id: 5002,
        isCurrentMax: true,
        rawValue: 155,
        value: 155,
      },
      tableData: [makeSetData(1, 155, 1)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    // Both workingMax and generatedMax produce snapshots
    expect(result.maxSnapshots).toHaveLength(2);

    const workingSnap = result.maxSnapshots.find(s => s.source === 'IMPORT');
    expect(workingSnap).toBeDefined();
    expect(workingSnap!.workingMax).toBe(150);

    const generatedSnap = result.maxSnapshots.find(s => s.source === 'WORKOUT');
    expect(generatedSnap).toBeDefined();
    expect(generatedSnap!.workingMax).toBe(150); // uses workingMax.rawValue as the base
    expect(generatedSnap!.generatedMax).toBe(155);
    expect(generatedSnap!.date).toBe('2025-06-01');
  });

  it('does not create MaxSnapshot when maxTrackingEnabled is false', () => {
    const item = makeWorkoutItem({
      maxTrackingEnabled: false,
      workingMax: {
        dateSet: '2025-05-01',
        id: 5001,
        isCurrentMax: true,
        rawValue: 150,
        value: 150,
      },
      tableData: [makeSetData(1, 140, 3)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.maxSnapshots).toHaveLength(0);
  });

  it('skips workingMax with rawValue 0', () => {
    const item = makeWorkoutItem({
      maxTrackingEnabled: true,
      workingMax: {
        dateSet: '2025-05-01',
        id: 5001,
        isCurrentMax: false,
        rawValue: 0,
        value: 0,
      },
      tableData: [makeSetData(1, 50, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.maxSnapshots).toHaveLength(0);
  });
});

// ============================================================
// Tests: deduplicateMaxSnapshots
// ============================================================

describe('deduplicateMaxSnapshots', () => {
  it('keeps highest workingMax for duplicate (athlete, exercise, date) keys', () => {
    const snapshots: TransformedMaxSnapshot[] = [
      {
        athleteTbId: 100,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-01',
        workingMax: 140,
        generatedMax: null,
        isCurrentMax: false,
        source: 'IMPORT',
      },
      {
        athleteTbId: 100,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-01',
        workingMax: 150,
        generatedMax: 155,
        isCurrentMax: true,
        source: 'WORKOUT',
      },
    ];

    const deduped = deduplicateMaxSnapshots(snapshots);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].workingMax).toBe(150);
    expect(deduped[0].source).toBe('WORKOUT');
  });

  it('keeps both when dates differ', () => {
    const snapshots: TransformedMaxSnapshot[] = [
      {
        athleteTbId: 100,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-01',
        workingMax: 140,
        generatedMax: null,
        isCurrentMax: false,
        source: 'IMPORT',
      },
      {
        athleteTbId: 100,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-08',
        workingMax: 150,
        generatedMax: null,
        isCurrentMax: true,
        source: 'IMPORT',
      },
    ];

    const deduped = deduplicateMaxSnapshots(snapshots);
    expect(deduped).toHaveLength(2);
  });

  it('keeps both when athletes differ', () => {
    const snapshots: TransformedMaxSnapshot[] = [
      {
        athleteTbId: 100,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-01',
        workingMax: 140,
        generatedMax: null,
        isCurrentMax: true,
        source: 'IMPORT',
      },
      {
        athleteTbId: 200,
        tbExerciseId: 1,
        exerciseName: 'Barbell Squat',
        date: '2025-06-01',
        workingMax: 160,
        generatedMax: null,
        isCurrentMax: true,
        source: 'IMPORT',
      },
    ];

    const deduped = deduplicateMaxSnapshots(snapshots);
    expect(deduped).toHaveLength(2);
  });
});

// ============================================================
// Tests: athlete transformation
// ============================================================

describe('athlete transformation', () => {
  it('transforms athlete profile with name, tbId, email', () => {
    const result = transformTeamBuildrExport(makeMinimalExport({
      'Matt Alldian': {
        profile: { id: 3534583, first: 'Matt', last: 'Alldian', email: 'matt@test.com' },
        workouts: {},
      },
    }));

    expect(result.athletes).toHaveLength(1);
    expect(result.athletes[0]).toMatchObject({
      tbId: 3534583,
      name: 'Matt Alldian',
      email: 'matt@test.com',
    });
  });

  it('trims whitespace from names', () => {
    const result = transformTeamBuildrExport(makeMinimalExport({
      'Michael Odermatt ': {
        profile: { id: 3534584, first: 'Michael', last: 'Odermatt ' },
        workouts: {},
      },
    }));

    expect(result.athletes[0].name).toBe('Michael Odermatt');
  });
});

// ============================================================
// Tests: session transformation
// ============================================================

describe('session transformation', () => {
  it('creates session from workout day data', () => {
    const item = makeWorkoutItem({ tableData: [makeSetData(1, 100, 5)] });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item], title: 'Week 1 Day 1' } },
      },
    }));

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toMatchObject({
      athleteTbId: 100,
      date: '2025-06-01',
      title: 'Week 1 Day 1',
    });
  });
});

// ============================================================
// Tests: exercise name resolution
// ============================================================

describe('exercise name resolution', () => {
  it('maps TeamBuildr name "Back Squat" to resolved name', () => {
    const item = makeWorkoutItem({
      exerciseName: 'Back Squat',
      tableData: [makeSetData(1, 140, 3)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    // Back Squat → Barbell Squat via teambuildrToFreeExerciseDb mapping
    expect(result.workoutExercises[0].exerciseName).toBe('Barbell Squat');
  });

  it('maps case-insensitive names like "Band Assisted Pull-up"', () => {
    const item = makeWorkoutItem({
      exerciseName: 'Band Assisted Pull-up',
      tableData: [makeSetData(1, 0, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].exerciseName).toBe('Band Assisted Pull-Up');
  });
});

// ============================================================
// Tests: unilateral (eachSide) mapping
// ============================================================

describe('unilateral mapping', () => {
  it('maps eachSide: true to isUnilateral: true', () => {
    const item = makeWorkoutItem({
      eachSide: true,
      tableData: [makeSetData(1, 30, 10)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].isUnilateral).toBe(true);
  });

  it('maps eachSide: false to isUnilateral: false', () => {
    const item = makeWorkoutItem({
      eachSide: false,
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].isUnilateral).toBe(false);
  });
});

// ============================================================
// Tests: rest time extraction
// ============================================================

describe('rest time extraction', () => {
  it('extracts restInSeconds from set data', () => {
    const item = makeWorkoutItem({
      tableData: [
        makeSetData(1, 100, 5, { restInSeconds: 180 }),
        makeSetData(2, 100, 5, { restInSeconds: 180 }),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].restTimeSeconds).toBe(180);
  });

  it('returns null when no rest time in sets', () => {
    const item = makeWorkoutItem({
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].restTimeSeconds).toBeNull();
  });
});

// ============================================================
// Tests: percentage of 1RM in sets
// ============================================================

describe('percentage of 1RM in sets', () => {
  it('passes percentage through to set-level percentageOf1RM', () => {
    const item = makeWorkoutItem({
      tableData: [
        makeSetData(1, 120, 3, { percentage: 80 }),
        makeSetData(2, 127.5, 3, { percentage: 85 }),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].sets[0].percentageOf1RM).toBe(80);
    expect(result.workoutExercises[0].sets[1].percentageOf1RM).toBe(85);
  });
});

// ============================================================
// Tests: RPE propagation to sets
// ============================================================

describe('RPE propagation to sets', () => {
  it('applies parsed RPE from additionalInformation to all sets', () => {
    const item = makeWorkoutItem({
      additionalInformation: 'RPE 7',
      tableData: [
        makeSetData(1, 100, 5),
        makeSetData(2, 100, 5),
      ],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].sets[0].rpe).toBe(7);
    expect(result.workoutExercises[0].sets[1].rpe).toBe(7);
  });

  it('sets rpe to null when no RPE in additionalInformation', () => {
    const item = makeWorkoutItem({
      additionalInformation: 'Slow eccentric, focus on bracing',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].sets[0].rpe).toBeNull();
  });
});

// ============================================================
// Tests: tempo extraction
// ============================================================

describe('tempo propagation', () => {
  it('extracts tempo from additionalInformation into exercise', () => {
    const item = makeWorkoutItem({
      additionalInformation: '3-1-0 tempo, RPE 7',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].tempo).toBe('3-1-0');
  });
});

// ============================================================
// Tests: notes pass-through
// ============================================================

describe('notes pass-through', () => {
  it('passes additionalInformation as notes', () => {
    const item = makeWorkoutItem({
      additionalInformation: 'RPE 8, keep hips under bar',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: { '2025-06-01': { workoutItems: [item] } },
      },
    }));

    expect(result.workoutExercises[0].notes).toBe('RPE 8, keep hips under bar');
  });
});

// ============================================================
// Tests: stats aggregation
// ============================================================

describe('stats aggregation', () => {
  it('correctly counts dates, items, sets, and skipped items', () => {
    const note = makeWorkoutItem({
      exerciseName: "Coach's Note",
      exerciseType: 'N',
      tableData: [],
    });
    const squat = makeWorkoutItem({
      exerciseName: 'Comp Squat',
      exerciseType: 'L',
      tableData: [
        makeSetData(1, 140, 3),
        makeSetData(2, 150, 2),
      ],
    });
    const bench = makeWorkoutItem({
      exerciseName: 'Comp Bench',
      exerciseType: 'L',
      tableData: [makeSetData(1, 100, 5)],
    });

    const result = transformTeamBuildrExport(makeMinimalExport({
      'Test Athlete': {
        profile: { id: 100, first: 'Test', last: 'Athlete' },
        workouts: {
          '2025-06-01': { workoutItems: [note, squat] },
          '2025-06-02': { workoutItems: [bench] },
        },
      },
    }));

    expect(result.stats.totalDates).toBe(2);
    expect(result.stats.totalWorkoutItems).toBe(3); // note + squat + bench
    expect(result.stats.totalLiftItems).toBe(2); // squat + bench (note skipped)
    expect(result.stats.totalSets).toBe(3); // 2 squat sets + 1 bench set
    expect(result.stats.skippedNonExercises).toBe(1);
  });

  it('tracks per-athlete stats', () => {
    const result = transformTeamBuildrExport(makeMinimalExport({
      'Athlete A': {
        profile: { id: 100, first: 'Athlete', last: 'A' },
        workouts: {
          '2025-06-01': {
            workoutItems: [
              makeWorkoutItem({ tableData: [makeSetData(1, 100, 5)] }),
            ],
          },
        },
      },
      'Athlete B': {
        profile: { id: 200, first: 'Athlete', last: 'B' },
        workouts: {
          '2025-06-01': {
            workoutItems: [
              makeWorkoutItem({ tableData: [makeSetData(1, 80, 8), makeSetData(2, 80, 8)] }),
            ],
          },
          '2025-06-02': {
            workoutItems: [
              makeWorkoutItem({ tableData: [makeSetData(1, 90, 5)] }),
            ],
          },
        },
      },
    }));

    expect(result.stats.athleteStats['Athlete A'].dates).toBe(1);
    expect(result.stats.athleteStats['Athlete A'].sets).toBe(1);
    expect(result.stats.athleteStats['Athlete B'].dates).toBe(2);
    expect(result.stats.athleteStats['Athlete B'].sets).toBe(3);
  });
});

// ============================================================
// Tests: multi-athlete export
// ============================================================

describe('multi-athlete transform', () => {
  it('transforms multiple athletes from a single export', () => {
    const result = transformTeamBuildrExport(makeMinimalExport({
      'Matt Alldian': {
        profile: { id: 3534583, first: 'Matt', last: 'Alldian' },
        workouts: {
          '2025-06-01': {
            workoutItems: [
              makeWorkoutItem({
                exerciseName: 'Comp Squat',
                tableData: [makeSetData(1, 200, 1)],
                maxTrackingEnabled: true,
                workingMax: { dateSet: '2025-06-01', id: 1, isCurrentMax: true, rawValue: 200, value: 200 },
              }),
            ],
          },
        },
      },
      'Chris Laakko': {
        profile: { id: 3534582, first: 'Chris', last: 'Laakko' },
        workouts: {
          '2025-06-01': {
            workoutItems: [
              makeWorkoutItem({
                exerciseName: 'Comp Bench',
                tableData: [makeSetData(1, 130, 1)],
              }),
            ],
          },
        },
      },
    }));

    expect(result.athletes).toHaveLength(2);
    expect(result.sessions).toHaveLength(2);
    expect(result.workoutExercises).toHaveLength(2);
    expect(result.maxSnapshots).toHaveLength(1); // only Matt had max tracking
  });
});
