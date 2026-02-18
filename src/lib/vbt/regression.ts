import type { LinearRegressionResult, RegressionLinePoint, VelocityDataPoint } from './types';

/**
 * Compute least-squares linear regression for load-velocity data.
 * Returns slope, intercept, and R² coefficient of determination.
 *
 * Model: velocity = slope * weight + intercept
 * For load-velocity profiles, slope is typically negative (heavier = slower).
 */
export function linearRegression(points: VelocityDataPoint[]): LinearRegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    sumX += p.weight;
    sumY += p.velocity;
    sumXY += p.weight * p.velocity;
    sumX2 += p.weight * p.weight;
    sumY2 += p.velocity * p.velocity;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.weight + intercept;
    ssRes += (p.velocity - predicted) ** 2;
    ssTot += (p.velocity - meanY) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

/**
 * Generate two endpoints for the regression line spanning the data range.
 * Adds a small margin on each side for visual clarity.
 */
export function regressionLinePoints(
  points: VelocityDataPoint[],
  regression: LinearRegressionResult
): RegressionLinePoint[] {
  if (points.length === 0) return [];

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const margin = (maxW - minW) * 0.05;

  const x1 = minW - margin;
  const x2 = maxW + margin;

  return [
    { weight: x1, velocity: regression.slope * x1 + regression.intercept },
    { weight: x2, velocity: regression.slope * x2 + regression.intercept },
  ];
}
