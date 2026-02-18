/**
 * Unit tests for RPE accuracy analysis module.
 *
 * Task 27.2 acceptance criteria:
 * - `calculateRpeAccuracy()` compares reported RPE to estimated via rpe-table reverse lookup
 * - Per-exercise and aggregate "avg +/- X RPE" metric
 * - Trend chart data (weekly deviation averages)
 * - Unit tested
 */

import { describe, it, expect } from 'vitest';
import {
  estimateRPEFromLoad,
  calculateRpeAccuracy,
  type RPEAccuracyInput,
} from './rpe-accuracy';

// ============================================================
// Tests: estimateRPEFromLoad (reverse lookup)
// ============================================================

describe('estimateRPEFromLoad', () => {
  it('returns RPE 10 for 100% of max @ 1 rep', () => {
    expect(estimateRPEFromLoad(1.0, 1)).toBe(10);
  });

  it('returns RPE 10 for 95.5% of max @ 2 reps', () => {
    // RPE 10 @ 2 reps = 0.955
    expect(estimateRPEFromLoad(0.955, 2)).toBe(10);
  });

  it('returns RPE 8 for ~81.1% of max @ 5 reps', () => {
    // RPE 8 @ 5 reps = 0.811
    expect(estimateRPEFromLoad(0.811, 5)).toBe(8);
  });

  it('returns RPE 9 for ~92.2% of max @ 1 rep', () => {
    // RPE 9 @ 1 rep = 0.955 — wait, that's RPE 9.5.
    // RPE 9 @ 1 rep = 0.955? No: RPE 9 @ 1 = 0.955 (table).
    // Actually check the table: RPE 10 @ 1 = 1.0, RPE 9.5 @ 1 = 0.978, RPE 9 @ 1 = 0.955
    expect(estimateRPEFromLoad(0.955, 1)).toBe(9);
  });

  it('finds closest RPE when percentage falls between table values', () => {
    // Between RPE 8 @ 5 (0.811) and RPE 8.5 @ 5 (0.824)
    // 0.818 is closer to 0.824 (diff 0.006) than 0.811 (diff 0.007) → RPE 8.5
    expect(estimateRPEFromLoad(0.818, 5)).toBe(8.5);
  });

  it('returns RPE 6 for very light loads', () => {
    // RPE 6 @ 5 reps = 0.762
    expect(estimateRPEFromLoad(0.762, 5)).toBe(6);
  });

  it('returns null for reps outside 1-12 range', () => {
    expect(estimateRPEFromLoad(0.8, 0)).toBeNull();
    expect(estimateRPEFromLoad(0.8, 13)).toBeNull();
  });

  it('handles reps rounding (4.6 rounds to 5)', () => {
    const atExact = estimateRPEFromLoad(0.811, 5);
    const atRounded = estimateRPEFromLoad(0.811, 4.6);
    expect(atRounded).toBe(atExact);
  });

  it('returns closest RPE for low percentages near table boundary', () => {
    // RPE 6 @ 12 reps = 0.572, RPE 6.5 @ 12 reps = 0.586
    // 0.58 is closer to 0.586 (diff 0.006) than 0.572 (diff 0.008) → RPE 6.5
    expect(estimateRPEFromLoad(0.58, 12)).toBe(6.5);
    // 0.572 exactly matches RPE 6 @ 12
    expect(estimateRPEFromLoad(0.572, 12)).toBe(6);
  });
});

// ============================================================
// Tests: calculateRpeAccuracy
// ============================================================

describe('calculateRpeAccuracy', () => {
  it('returns null for empty inputs', () => {
    expect(calculateRpeAccuracy([])).toBeNull();
  });

  it('returns null when all inputs are invalid', () => {
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 8, weight: 0, reps: 5, e1RM: 200, date: '2025-01-01' },
      { reportedRPE: 8, weight: 100, reps: 0, e1RM: 200, date: '2025-01-01' },
      { reportedRPE: 8, weight: 100, reps: 5, e1RM: 0, date: '2025-01-01' },
    ];
    expect(calculateRpeAccuracy(inputs)).toBeNull();
  });

  it('returns perfect accuracy when reported matches estimated', () => {
    // 162.2kg @ 5 reps with e1RM of 200kg → %1RM = 0.811 → estimated RPE = 8
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 8, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.averageDeviation).toBe(0);
    expect(result!.setsAnalyzed).toBe(1);
  });

  it('calculates correct deviation when athlete overrates RPE', () => {
    // 162.2kg @ 5 reps with e1RM 200 → %1RM = 0.811 → estimated RPE = 8
    // Athlete reports RPE 9 → deviation = 9 - 8 = +1
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.averageDeviation).toBe(1);
    expect(result!.details[0].deviation).toBe(1);
    expect(result!.details[0].estimatedRPE).toBe(8);
    expect(result!.details[0].reportedRPE).toBe(9);
  });

  it('calculates correct deviation when athlete underrates RPE', () => {
    // 162.2kg @ 5 reps with e1RM 200 → estimated RPE = 8
    // Athlete reports RPE 7 → deviation = 7 - 8 = -1
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 7, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    // Average deviation is absolute
    expect(result!.averageDeviation).toBe(1);
    // But individual deviation preserves direction
    expect(result!.details[0].deviation).toBe(-1);
  });

  it('calculates aggregate average deviation from multiple sets', () => {
    // Set 1: 200kg @ 1 rep, e1RM 200 → %1RM = 1.0 → est RPE 10, report 10 → dev 0
    // Set 2: 162.2kg @ 5 reps, e1RM 200 → %1RM = 0.811 → est RPE 8, report 9 → dev +1
    // Set 3: 162.2kg @ 5 reps, e1RM 200 → est RPE 8, report 7 → dev -1
    // Avg abs deviation = (0 + 1 + 1) / 3 = 0.7
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 10, weight: 200, reps: 1, e1RM: 200, date: '2025-01-06' },
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
      { reportedRPE: 7, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-07' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.setsAnalyzed).toBe(3);
    expect(result!.averageDeviation).toBe(0.7);
  });

  it('skips sets where weight exceeds 105% of e1RM', () => {
    const inputs: RPEAccuracyInput[] = [
      // This set has weight > 1.05 * e1RM (220 / 200 = 1.1), should be skipped
      { reportedRPE: 10, weight: 220, reps: 1, e1RM: 200, date: '2025-01-06' },
      // This set is valid
      { reportedRPE: 8, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.setsAnalyzed).toBe(1);
  });

  it('skips sets with reps outside table range (>12)', () => {
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 7, weight: 100, reps: 15, e1RM: 200, date: '2025-01-06' },
      { reportedRPE: 8, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.setsAnalyzed).toBe(1);
  });

  it('produces correct weekly trend data', () => {
    // Week 1 (Mon Jan 6): 2 sets with deviation 0 and 1 → avg 0.5
    // Week 2 (Mon Jan 13): 1 set with deviation 2 → avg 2
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 10, weight: 200, reps: 1, e1RM: 200, date: '2025-01-06' }, // exact match, dev 0
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-08' }, // dev +1
      { reportedRPE: 10, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-13' }, // dev +2
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.weeklyTrend).toHaveLength(2);

    // Week 1: avg abs deviation = (0 + 1) / 2 = 0.5
    expect(result!.weeklyTrend[0].weekStart).toBe('2025-01-06');
    expect(result!.weeklyTrend[0].avgDeviation).toBe(0.5);
    expect(result!.weeklyTrend[0].setsAnalyzed).toBe(2);

    // Week 2: avg abs deviation = 2 / 1 = 2
    expect(result!.weeklyTrend[1].weekStart).toBe('2025-01-13');
    expect(result!.weeklyTrend[1].avgDeviation).toBe(2);
    expect(result!.weeklyTrend[1].setsAnalyzed).toBe(1);
  });

  it('weekly trend is sorted chronologically', () => {
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-02-10' },
      { reportedRPE: 8, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
      { reportedRPE: 8.5, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-20' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();

    const weekStarts = result!.weeklyTrend.map(w => w.weekStart);
    const sorted = [...weekStarts].sort();
    expect(weekStarts).toEqual(sorted);
  });

  it('includes per-set detail breakdown', () => {
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },
      { reportedRPE: 7, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-07' },
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.details).toHaveLength(2);

    // Both are at 81.1% → estimated RPE 8
    expect(result!.details[0].estimatedRPE).toBe(8);
    expect(result!.details[0].reportedRPE).toBe(9);
    expect(result!.details[0].deviation).toBe(1);
    expect(result!.details[0].date).toBe('2025-01-06');

    expect(result!.details[1].estimatedRPE).toBe(8);
    expect(result!.details[1].reportedRPE).toBe(7);
    expect(result!.details[1].deviation).toBe(-1);
    expect(result!.details[1].date).toBe('2025-01-07');
  });

  it('handles mixed valid and invalid inputs gracefully', () => {
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 8, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' }, // valid
      { reportedRPE: 8, weight: 0, reps: 5, e1RM: 200, date: '2025-01-06' },     // invalid: 0 weight
      { reportedRPE: 8, weight: 100, reps: -1, e1RM: 200, date: '2025-01-06' },   // invalid: negative reps
      { reportedRPE: 8, weight: 100, reps: 5, e1RM: -50, date: '2025-01-06' },    // invalid: negative e1RM
      { reportedRPE: 9, weight: 191, reps: 2, e1RM: 200, date: '2025-01-07' },    // valid: %1RM = 0.955 → est RPE 9
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    expect(result!.setsAnalyzed).toBe(2);
  });

  it('rounds average deviation to 1 decimal place', () => {
    // 3 sets with deviations +1, -0.5, +0.5 → abs = 1, 0.5, 0.5 → avg = 2/3 ≈ 0.7
    const inputs: RPEAccuracyInput[] = [
      { reportedRPE: 9, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },     // est 8, dev +1
      { reportedRPE: 7.5, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },   // est 8, dev -0.5
      { reportedRPE: 8.5, weight: 162.2, reps: 5, e1RM: 200, date: '2025-01-06' },   // est 8, dev +0.5
    ];
    const result = calculateRpeAccuracy(inputs);
    expect(result).not.toBeNull();
    // (1 + 0.5 + 0.5) / 3 = 0.6666... → rounds to 0.7
    expect(result!.averageDeviation).toBe(0.7);
  });
});
