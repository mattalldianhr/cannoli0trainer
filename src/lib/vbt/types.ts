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
