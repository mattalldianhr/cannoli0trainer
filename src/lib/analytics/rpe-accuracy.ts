/**
 * RPE Accuracy Analysis
 *
 * Compares athlete's self-reported RPE to an estimated RPE derived from
 * load/reps relative to known 1RM (via the Tuchscherer RPE table).
 *
 * Estimated RPE = reverse-lookup: given (weight / e1RM) and reps, find the closest RPE.
 * Accuracy = average absolute difference between reported and estimated RPE.
 */

import { getPercentOneRM, type RPEValue } from '@/lib/rpe-table';

/** Valid RPE values for reverse lookup (6–10 in 0.5 increments, descending) */
const RPE_SEARCH_VALUES: RPEValue[] = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];

/**
 * Reverse-lookup: given a %1RM (as decimal) and rep count, find the closest RPE.
 *
 * Searches the RPE table for the entry where the %1RM is closest to the target.
 * Returns null if reps are out of the table range (1–12).
 */
export function estimateRPEFromLoad(percentOfMax: number, reps: number): number | null {
  const roundedReps = Math.round(reps);
  if (roundedReps < 1 || roundedReps > 12) return null;

  let closestRPE: number | null = null;
  let closestDiff = Infinity;

  for (const rpe of RPE_SEARCH_VALUES) {
    const tablePct = getPercentOneRM(rpe, roundedReps);
    if (tablePct === null) continue;

    const diff = Math.abs(tablePct - percentOfMax);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestRPE = rpe;
    }
  }

  return closestRPE;
}

export interface RPEAccuracyInput {
  reportedRPE: number;
  weight: number;
  reps: number;
  e1RM: number;
  date: string;
  exerciseId?: string;
  exerciseName?: string;
}

export interface RPEAccuracyResult {
  /** Average absolute difference between reported and estimated RPE */
  averageDeviation: number;
  /** Number of sets analyzed */
  setsAnalyzed: number;
  /** Per-set breakdown */
  details: {
    reportedRPE: number;
    estimatedRPE: number;
    deviation: number;
    date: string;
  }[];
  /** Weekly trend of average deviation */
  weeklyTrend: {
    weekStart: string;
    avgDeviation: number;
    setsAnalyzed: number;
  }[];
}

/**
 * Calculate RPE accuracy for a set of training data.
 *
 * For each set where we have reported RPE, weight, reps, and a known e1RM,
 * we reverse-lookup what the RPE "should have been" based on the load and
 * compare it to the athlete's self-report.
 */
export function calculateRpeAccuracy(inputs: RPEAccuracyInput[]): RPEAccuracyResult | null {
  const details: RPEAccuracyResult['details'] = [];

  for (const input of inputs) {
    if (input.e1RM <= 0 || input.weight <= 0 || input.reps < 1) continue;

    const percentOfMax = input.weight / input.e1RM;

    // Skip if the weight exceeds what the table can represent
    // (> 100% of e1RM at that rep count would be out of range)
    if (percentOfMax > 1.05) continue;

    const estimatedRPE = estimateRPEFromLoad(percentOfMax, input.reps);
    if (estimatedRPE === null) continue;

    details.push({
      reportedRPE: input.reportedRPE,
      estimatedRPE,
      deviation: input.reportedRPE - estimatedRPE,
      date: input.date,
    });
  }

  if (details.length === 0) return null;

  const totalAbsDeviation = details.reduce((sum, d) => sum + Math.abs(d.deviation), 0);
  const averageDeviation = Math.round((totalAbsDeviation / details.length) * 10) / 10;

  // Weekly trend
  const weekMap: Record<string, { totalAbsDev: number; count: number }> = {};
  for (const d of details) {
    const weekStart = getISOWeekStart(new Date(d.date));
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = { totalAbsDev: 0, count: 0 };
    }
    weekMap[weekStart].totalAbsDev += Math.abs(d.deviation);
    weekMap[weekStart].count += 1;
  }

  const weeklyTrend = Object.entries(weekMap)
    .map(([weekStart, data]) => ({
      weekStart,
      avgDeviation: Math.round((data.totalAbsDev / data.count) * 10) / 10,
      setsAnalyzed: data.count,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return {
    averageDeviation,
    setsAnalyzed: details.length,
    details,
    weeklyTrend,
  };
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}
