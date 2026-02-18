/**
 * TypeScript types for the TeamBuildr export JSON format.
 *
 * Source: test-data/teambuildr-full-export-5-athletes.json
 * Schema docs: test-data/SCHEMA.md
 */

// ============================================================
// Export file structure
// ============================================================

export interface TeamBuildrExport {
  metadata: ExportMetadata;
  athletes: Record<string, AthleteExport>;
}

export interface ExportMetadata {
  extractedAt: string;
  source: string;
  accountId: number;
  athleteCount: number;
  totalWorkoutDates: number;
  totalApiCalls: number;
  errors: number;
}

// ============================================================
// Athlete
// ============================================================

export interface AthleteExport {
  profile: AthleteProfile;
  dateRange: { first: string; last: string; totalDates: number };
  workoutOverview: WorkoutOverviewDay[];
  workouts: Record<string, WorkoutDay>;
  summaries: Record<string, SessionSummary>;
}

export interface AthleteProfile {
  id: number;
  first: string;
  last: string;
  email?: string;
  username?: string;
  pic: string | null;
  admin: number;
  primaryAdmin: number;
  gradientColors: string[];
  calendarAssignment: {
    id: number;
    calendarId: number;
    dateStart: string;
    dateEnd: string;
    active: number;
    suspended: number;
    addedBy: number;
    addedTime: number;
  } | null;
  groupAssignments: {
    id: number;
    name: string;
    groupId: number;
    userId: number;
    addedBy: number;
    addedTime: number;
  }[];
  pinEnabled?: boolean;
}

// ============================================================
// Workout overview (calendar view)
// ============================================================

export interface WorkoutOverviewDay {
  date: string;
  actionableItems: number;
  completedItems: number;
  completionPercentage: number | null;
  statusColorCode: string | null;
  statusDescription: 'NOT_STARTED' | 'PARTIALLY_COMPLETED' | 'FULLY_COMPLETED' | 'NO_WORKOUT';
  backgroundColorCode: string | null;
  title: string | null;
  totalItems: number;
}

// ============================================================
// Workout day detail
// ============================================================

export interface WorkoutDay {
  color: string | null;
  sessionDurationInSeconds: number;
  sessionDurationDescription: string;
  title: string | null;
  workoutItems: WorkoutItem[];
  assignedDayBasedProgramsData: unknown[];
  activeDayBasedProgramsData: unknown[];
}

export interface WorkoutItem {
  assignedId: number;
  completionId: number;

  exercise: {
    id: number;
    name: string;
    type: ExerciseTypeCode;
    typeDescription: string;
    trackingEnabled: boolean;
    trackingType: number;
    trackingTypeDescription: string;
    description: string | null;
    media: string | null;
    documentId: number | null;
  };

  additionalInformation: string | null;
  formType: string;
  icon: string;
  type: ExerciseTypeCode;
  typeDescription: string;
  title: string;
  subTitle: string;

  fullyCompleted: boolean;
  completeableItem: boolean;
  completionCheckbox: boolean;
  completionRequired: boolean;
  athleteAddedItem: boolean;
  coachCompletionOnly: boolean;
  optedOut: boolean;
  optedOutReason: string | null;

  totalLoad: number;
  totalReps: number;
  trackingLoad: boolean;
  trackingRepCount: boolean;

  workingMax: MaxData | null;
  generatedMax: MaxData | null;
  maxTrackingEnabled: boolean;

  eachSide: boolean;
  groupingLetter: string | null;
  groupingColorCode: string | null;

  historyEnabled: boolean;
  journalEntriesEnabled: boolean;
  optOutEnabled: boolean;
  substitutionEnabled: boolean;
  progressionLevel: number | null;
  progressionMasteredInputEnabled: boolean;
  progressionStepMastered: boolean;

  tableHeaders: TableHeader[] | null;
  tableData: SetData[];

  documents: unknown[];
  journalEntries: unknown[];
  questions: unknown[];
}

export type ExerciseTypeCode = 'L' | 'S' | 'C' | 'N' | 'W' | 'Sc';

export interface MaxData {
  dateSet: string;
  id: number;
  isCurrentMax: boolean;
  rawValue: number;
  value: number;
}

export interface TableHeader {
  valueDescription: string;
  valueName: string;
}

export interface SetData {
  setId: number;
  values: SetValue[];
  percentage: number | null;
  restInSeconds: number | null;
  isActiveSet: boolean;
}

export interface SetValue {
  placeholder: string | null;
  readOnly: boolean;
  timerEnabled: boolean;
  value: number | null;
  valueDescription: string;
  valueName: string;
  valueType: 'FLOAT' | 'INTEGER';
}

// ============================================================
// Session summary
// ============================================================

export interface SessionSummary {
  hasData: boolean;
  setsCompleted: number;
  repsCompleted: number;
  tonnage: number;
  sessionDurationInSeconds: number;
  sessionDurationDescription: string;
  newPRs: {
    exerciseId: number;
    exerciseName: string;
    maxValue: number;
  }[];
  sessionDate: string;
  userId: number;
  zeroBasedDayNum: number | null;
  trueDayNum: number | null;
}
