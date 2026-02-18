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

/** A set with both weight and velocity for load-bracket grouping */
export interface WeightedVelocitySet {
  weight: number;
  velocity: number;
  date: string;
}

/** A single week's average velocity at a load bracket */
export interface WeeklyVelocityPoint {
  week: string; // ISO week start date (YYYY-MM-DD, Monday)
  meanVelocity: number;
  setCount: number;
}

/** Cross-session velocity trend result for one exercise */
export interface VelocityTrendResult {
  weeklyPoints: WeeklyVelocityPoint[];
  latestWeekOverWeekChange: number | null; // % change, negative = decline
  alert: boolean; // true when >5% drop
}

/** Preparedness comparison: today's velocity vs rolling baseline */
export interface PreparednessResult {
  currentVelocity: number;
  baselineVelocity: number;
  difference: number;
  percentageDiff: number;
  status: 'above' | 'at' | 'below';
}
