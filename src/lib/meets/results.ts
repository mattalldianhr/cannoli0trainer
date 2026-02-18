import { wilks, wilks2020, dots } from 'powerlifting-formulas';

export type Gender = 'male' | 'female';

export interface AttemptResult {
  weight: number;
  good: boolean;
}

export type AttemptResults = Record<string, AttemptResult[]>;

export interface MeetResultInput {
  athleteName: string;
  bodyweight: number | null;
  weightClass: string | null;
  gender: Gender;
  attemptResults: AttemptResults | null;
  // Fallback planned attempts if no attemptResults
  squat1?: number | null;
  squat2?: number | null;
  squat3?: number | null;
  bench1?: number | null;
  bench2?: number | null;
  bench3?: number | null;
  deadlift1?: number | null;
  deadlift2?: number | null;
  deadlift3?: number | null;
}

export interface LiftResult {
  best: number | null;
  attempts: { weight: number; good: boolean | null }[];
  madeCount: number;
  attemptedCount: number;
}

export interface MeetResultSummary {
  athleteName: string;
  bodyweight: number | null;
  weightClass: string | null;
  gender: Gender;
  squat: LiftResult;
  bench: LiftResult;
  deadlift: LiftResult;
  total: number | null;
  madeCount: number;
  attemptedCount: number;
  dotsScore: number | null;
  wilksScore: number | null;
  wilks2020Score: number | null;
}

const LIFTS = ['squat', 'bench', 'deadlift'] as const;

function getBestSuccessfulAttempt(
  input: MeetResultInput,
  lift: (typeof LIFTS)[number]
): LiftResult {
  const results = input.attemptResults?.[lift];

  if (results && results.some((r) => r.weight > 0)) {
    const attempts = results.map((r) => ({
      weight: r.weight,
      good: r.weight > 0 ? r.good : null,
    }));
    const goodAttempts = results
      .filter((r) => r.good && r.weight > 0)
      .map((r) => r.weight);
    const madeCount = goodAttempts.length;
    const attemptedCount = results.filter((r) => r.weight > 0).length;
    const best = goodAttempts.length > 0 ? Math.max(...goodAttempts) : null;

    return { best, attempts, madeCount, attemptedCount };
  }

  // Fallback to planned attempts (no make/miss data)
  const planned = [1, 2, 3].map((n) => {
    const key = `${lift}${n}` as keyof MeetResultInput;
    const val = input[key] as number | null | undefined;
    return { weight: val ?? 0, good: null as boolean | null };
  });

  const vals = planned.filter((p) => p.weight > 0).map((p) => p.weight);
  return {
    best: vals.length > 0 ? Math.max(...vals) : null,
    attempts: planned,
    madeCount: 0,
    attemptedCount: 0,
  };
}

export function calculateMeetResult(input: MeetResultInput): MeetResultSummary {
  const squat = getBestSuccessfulAttempt(input, 'squat');
  const bench = getBestSuccessfulAttempt(input, 'bench');
  const deadlift = getBestSuccessfulAttempt(input, 'deadlift');

  const hasAnyBest = squat.best != null || bench.best != null || deadlift.best != null;
  const total = hasAnyBest
    ? (squat.best ?? 0) + (bench.best ?? 0) + (deadlift.best ?? 0)
    : null;

  const madeCount = squat.madeCount + bench.madeCount + deadlift.madeCount;
  const attemptedCount = squat.attemptedCount + bench.attemptedCount + deadlift.attemptedCount;

  let dotsScore: number | null = null;
  let wilksScore: number | null = null;
  let wilks2020Score: number | null = null;

  if (total != null && total > 0 && input.bodyweight != null && input.bodyweight > 0) {
    try {
      dotsScore = dots(input.bodyweight, total, input.gender);
      wilksScore = wilks(input.bodyweight, total, input.gender);
      wilks2020Score = wilks2020(input.bodyweight, total, input.gender);
    } catch {
      // Invalid inputs — leave as null
    }
  }

  return {
    athleteName: input.athleteName,
    bodyweight: input.bodyweight,
    weightClass: input.weightClass,
    gender: input.gender,
    squat,
    bench,
    deadlift,
    total,
    madeCount,
    attemptedCount,
    dotsScore,
    wilksScore,
    wilks2020Score,
  };
}

export function formatScore(score: number | null): string {
  if (score == null) return '-';
  return score.toFixed(1);
}
