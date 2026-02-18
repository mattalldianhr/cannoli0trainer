import type {
  VelocityDataPoint,
  VelocityProfileRow,
  PreparednessResult,
  WeightedVelocitySet,
  VelocityTrendResult,
} from './types';
import { linearRegression } from './regression';

/** Standard %1RM buckets for velocity profile table */
const PROFILE_PERCENTAGES = [60, 70, 80, 90] as const;

/** Bucket tolerance: +-5% around the target (e.g., 60% = 55-65%) */
const BUCKET_TOLERANCE = 5;

/**
 * Build a velocity profile table from historical load-velocity data.
 *
 * Requires an estimated 1RM to convert raw weights to %1RM.
 * Groups data points into %1RM buckets (60%, 70%, 80%, 90%) and
 * averages the velocity within each bucket.
 */
export function buildVelocityProfile(
  data: VelocityDataPoint[],
  estimated1RM: number
): VelocityProfileRow[] {
  if (data.length === 0 || estimated1RM <= 0) {
    return PROFILE_PERCENTAGES.map((pct) => ({
      percentageLabel: `${pct}%`,
      percentage: pct,
      avgVelocity: null,
      sampleCount: 0,
    }));
  }

  return PROFILE_PERCENTAGES.map((targetPct) => {
    const lower = targetPct - BUCKET_TOLERANCE;
    const upper = targetPct + BUCKET_TOLERANCE;

    // Find data points within this %1RM bucket
    const inBucket = data.filter((d) => {
      const pct1RM = (d.weight / estimated1RM) * 100;
      return pct1RM >= lower && pct1RM <= upper;
    });

    const avgVelocity =
      inBucket.length > 0
        ? Math.round(
            (inBucket.reduce((sum, d) => sum + d.velocity, 0) / inBucket.length) * 1000
          ) / 1000
        : null;

    return {
      percentageLabel: `${targetPct}%`,
      percentage: targetPct,
      avgVelocity,
      sampleCount: inBucket.length,
    };
  });
}

/**
 * Estimate velocity at a given %1RM using the regression model.
 * Falls back to null if regression is not computable.
 */
export function estimateVelocityAt1RMPercent(
  data: VelocityDataPoint[],
  estimated1RM: number,
  targetPercent: number
): number | null {
  const regression = linearRegression(data);
  if (!regression) return null;

  const targetWeight = (targetPercent / 100) * estimated1RM;
  const velocity = regression.slope * targetWeight + regression.intercept;
  return Math.round(velocity * 1000) / 1000;
}

/**
 * Calculate preparedness by comparing recent velocity to a rolling baseline.
 *
 * @param recentData - Data from the most recent session (today or latest)
 * @param baselineData - Historical data for baseline calculation (e.g., last 4 weeks)
 * @param loadTolerance - Weight tolerance in kg to match "same load" sets (default +-5kg)
 */
export function calculatePreparedness(
  recentData: VelocityDataPoint[],
  baselineData: VelocityDataPoint[],
  loadTolerance = 5
): PreparednessResult | null {
  if (recentData.length === 0 || baselineData.length === 0) return null;

  // Average velocity of recent session
  const currentVelocity =
    recentData.reduce((sum, d) => sum + d.velocity, 0) / recentData.length;

  // For each recent data point, find baseline data at similar loads
  const matchedBaseline: number[] = [];
  for (const recent of recentData) {
    const sameLoad = baselineData.filter(
      (b) => Math.abs(b.weight - recent.weight) <= loadTolerance
    );
    if (sameLoad.length > 0) {
      const avg = sameLoad.reduce((s, d) => s + d.velocity, 0) / sameLoad.length;
      matchedBaseline.push(avg);
    }
  }

  // If no load-matched baseline, fall back to overall baseline average
  const baselineVelocity =
    matchedBaseline.length > 0
      ? matchedBaseline.reduce((s, v) => s + v, 0) / matchedBaseline.length
      : baselineData.reduce((s, d) => s + d.velocity, 0) / baselineData.length;

  const difference = Math.round((currentVelocity - baselineVelocity) * 1000) / 1000;
  const percentageDiff =
    baselineVelocity !== 0
      ? Math.round((difference / baselineVelocity) * 1000) / 10
      : 0;

  // Status thresholds: +-2% considered "at baseline"
  let status: PreparednessResult['status'];
  if (percentageDiff > 2) {
    status = 'above';
  } else if (percentageDiff < -2) {
    status = 'below';
  } else {
    status = 'at';
  }

  return {
    currentVelocity: Math.round(currentVelocity * 1000) / 1000,
    baselineVelocity: Math.round(baselineVelocity * 1000) / 1000,
    difference,
    percentageDiff,
    status,
  };
}

/**
 * Calculate velocity drop (fatigue) within a single session.
 *
 * Returns the percentage drop from the first set velocity to the last set velocity.
 * Formula: ((set1_velocity - final_set_velocity) / set1_velocity) * 100
 */
export function calculateVelocityDrop(velocities: number[]): number | null {
  if (velocities.length < 2) return null;

  const first = velocities[0];
  const last = velocities[velocities.length - 1];

  if (first === 0) return null;

  return Math.round(((first - last) / first) * 1000) / 10;
}

/**
 * Get ISO week start date (Monday) for a given date string.
 */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate cross-session velocity trend at ~80% 1RM over weeks.
 *
 * Groups sets into the 75-85% 1RM load bracket, averages velocity per ISO week,
 * then computes week-over-week change. Alerts when the latest change exceeds -5%.
 *
 * Requires an estimated 1RM to determine load brackets.
 * Returns null if fewer than 3 weeks of data.
 */
export function calculateVelocityTrend(
  sets: WeightedVelocitySet[],
  estimated1RM: number
): VelocityTrendResult | null {
  if (sets.length === 0 || estimated1RM <= 0) return null;

  // Filter to ~80% 1RM bracket (75-85%)
  const lowerWeight = estimated1RM * 0.75;
  const upperWeight = estimated1RM * 0.85;

  const inBracket = sets.filter(
    (s) => s.weight >= lowerWeight && s.weight <= upperWeight
  );

  if (inBracket.length === 0) return null;

  // Group by ISO week
  const weekMap: Record<string, { totalVelocity: number; count: number }> = {};
  for (const s of inBracket) {
    const week = getWeekStart(s.date);
    if (!weekMap[week]) {
      weekMap[week] = { totalVelocity: 0, count: 0 };
    }
    weekMap[week].totalVelocity += s.velocity;
    weekMap[week].count += 1;
  }

  const weeklyPoints = Object.entries(weekMap)
    .map(([week, data]) => ({
      week,
      meanVelocity: Math.round((data.totalVelocity / data.count) * 1000) / 1000,
      setCount: data.count,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  if (weeklyPoints.length < 3) return null;

  // Week-over-week change: compare last 2 weeks' rolling average to prior 2 weeks
  const len = weeklyPoints.length;
  const recentAvg =
    (weeklyPoints[len - 1].meanVelocity + weeklyPoints[len - 2].meanVelocity) / 2;
  const priorAvg =
    (weeklyPoints[len - 3].meanVelocity +
      (len >= 4 ? weeklyPoints[len - 4].meanVelocity : weeklyPoints[len - 3].meanVelocity)) / 2;

  const latestWeekOverWeekChange =
    priorAvg !== 0
      ? Math.round(((recentAvg - priorAvg) / priorAvg) * 1000) / 10
      : null;

  return {
    weeklyPoints,
    latestWeekOverWeekChange,
    alert: latestWeekOverWeekChange !== null && latestWeekOverWeekChange < -5,
  };
}
