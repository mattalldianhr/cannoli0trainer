/**
 * RPE/RIR-to-%1RM Lookup Table
 *
 * Based on the Tuchscherer RPE table (Reactive Training Systems).
 * Maps RPE (6–10) and reps (1–12) to estimated %1RM.
 *
 * RIR = 10 - RPE (e.g., RPE 8 = 2 RIR)
 */

/** Valid RPE values: 6 to 10 in 0.5 increments */
export type RPEValue = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

/** Valid rep counts for the lookup table */
export type RepCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Tuchscherer RPE-to-%1RM table.
 * Key: RPE value, Value: map of reps → %1RM (as decimal, e.g., 0.955 = 95.5%)
 */
const RPE_TABLE: Record<RPEValue, Record<RepCount, number>> = {
  10:   { 1: 1.000, 2: 0.955, 3: 0.922, 4: 0.892, 5: 0.863, 6: 0.837, 7: 0.811, 8: 0.786, 9: 0.762, 10: 0.739, 11: 0.707, 12: 0.680 },
  9.5:  { 1: 0.978, 2: 0.939, 3: 0.907, 4: 0.878, 5: 0.850, 6: 0.824, 7: 0.799, 8: 0.774, 9: 0.751, 10: 0.723, 11: 0.694, 12: 0.667 },
  9:    { 1: 0.955, 2: 0.922, 3: 0.892, 4: 0.863, 5: 0.837, 6: 0.811, 7: 0.786, 8: 0.762, 9: 0.739, 10: 0.707, 11: 0.680, 12: 0.653 },
  8.5:  { 1: 0.939, 2: 0.907, 3: 0.878, 4: 0.850, 5: 0.824, 6: 0.799, 7: 0.774, 8: 0.751, 9: 0.723, 10: 0.694, 11: 0.667, 12: 0.640 },
  8:    { 1: 0.922, 2: 0.892, 3: 0.863, 4: 0.837, 5: 0.811, 6: 0.786, 7: 0.762, 8: 0.739, 9: 0.707, 10: 0.680, 11: 0.653, 12: 0.626 },
  7.5:  { 1: 0.907, 2: 0.878, 3: 0.850, 4: 0.824, 5: 0.799, 6: 0.774, 7: 0.751, 8: 0.723, 9: 0.694, 10: 0.667, 11: 0.640, 12: 0.613 },
  7:    { 1: 0.892, 2: 0.863, 3: 0.837, 4: 0.811, 5: 0.786, 6: 0.762, 7: 0.739, 8: 0.707, 9: 0.680, 10: 0.653, 11: 0.626, 12: 0.599 },
  6.5:  { 1: 0.878, 2: 0.850, 3: 0.824, 4: 0.799, 5: 0.774, 6: 0.751, 7: 0.723, 8: 0.694, 9: 0.667, 10: 0.640, 11: 0.613, 12: 0.586 },
  6:    { 1: 0.863, 2: 0.837, 3: 0.811, 4: 0.786, 5: 0.762, 6: 0.739, 7: 0.707, 8: 0.680, 9: 0.653, 10: 0.626, 11: 0.599, 12: 0.572 },
};

/**
 * Look up the estimated %1RM for a given RPE and rep count.
 *
 * @param rpe - RPE value (6–10, 0.5 increments)
 * @param reps - Number of reps (1–12)
 * @returns Percentage of 1RM as a decimal (e.g., 0.863 = 86.3%), or null if inputs are out of range
 */
export function getPercentOneRM(rpe: number, reps: number): number | null {
  const roundedRpe = Math.round(rpe * 2) / 2;
  const roundedReps = Math.round(reps);

  if (roundedRpe < 6 || roundedRpe > 10 || roundedReps < 1 || roundedReps > 12) {
    return null;
  }

  return RPE_TABLE[roundedRpe as RPEValue]?.[roundedReps as RepCount] ?? null;
}

/**
 * Estimate the weight for a given 1RM, RPE, and rep count.
 *
 * @param oneRepMax - The athlete's 1RM in any weight unit
 * @param rpe - Target RPE (6–10)
 * @param reps - Target reps (1–12)
 * @returns Estimated weight, or null if inputs are out of range
 */
export function getWeightFromOneRM(oneRepMax: number, rpe: number, reps: number): number | null {
  const pct = getPercentOneRM(rpe, reps);
  if (pct === null) return null;
  return Math.round(oneRepMax * pct * 10) / 10;
}

/**
 * Estimate 1RM from a set's weight, reps, and RPE.
 *
 * @param weight - Weight used
 * @param rpe - Reported RPE (6–10)
 * @param reps - Reps performed (1–12)
 * @returns Estimated 1RM, or null if inputs are out of range
 */
export function estimateOneRMFromRPE(weight: number, rpe: number, reps: number): number | null {
  const pct = getPercentOneRM(rpe, reps);
  if (pct === null || pct === 0) return null;
  return Math.round((weight / pct) * 10) / 10;
}

/**
 * Convert RPE to RIR (Reps in Reserve).
 * RIR = 10 - RPE
 */
export function rpeToRIR(rpe: number): number {
  return 10 - rpe;
}

/**
 * Convert RIR to RPE.
 * RPE = 10 - RIR
 */
export function rirToRPE(rir: number): number {
  return 10 - rir;
}

/**
 * Get the full RPE table data for display purposes (e.g., reference chart).
 * Returns a copy of the table.
 */
export function getRPETable(): Record<RPEValue, Record<RepCount, number>> {
  return { ...RPE_TABLE };
}

/** All valid RPE values in descending order (for UI selectors) */
export const RPE_VALUES: RPEValue[] = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];

/** RPE descriptions for reference charts */
export const RPE_DESCRIPTIONS: Record<RPEValue, string> = {
  10:  'Maximum effort — no reps left',
  9.5: 'Could maybe do 1 more rep',
  9:   '1 rep left in reserve',
  8.5: 'Could definitely do 1 more, maybe 2',
  8:   '2 reps left in reserve',
  7.5: 'Could definitely do 2 more, maybe 3',
  7:   '3 reps left in reserve',
  6.5: 'Could definitely do 3 more, maybe 4',
  6:   '4 reps left in reserve',
};
