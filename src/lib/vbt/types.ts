/** A single velocity data point from a set log */
export interface VelocityDataPoint {
  weight: number;
  velocity: number;
  date: string;
  reps?: number;
  rpe?: number;
}

/** Result of a least-squares linear regression */
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

/** A point on the regression line for chart rendering */
export interface RegressionLinePoint {
  weight: number;
  velocity: number;
}

/** Velocity profile row: avg velocity at a given %1RM */
export interface VelocityProfileRow {
  percentageLabel: string;
  percentage: number;
  avgVelocity: number | null;
  sampleCount: number;
}

/** Preparedness comparison: today's velocity vs rolling baseline */
export interface PreparednessResult {
  currentVelocity: number;
  baselineVelocity: number;
  difference: number;
  percentageDiff: number;
  status: 'above' | 'at' | 'below';
}
