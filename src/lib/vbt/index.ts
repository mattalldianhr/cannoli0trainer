export { linearRegression, regressionLinePoints } from './regression';
export {
  buildVelocityProfile,
  estimateVelocityAt1RMPercent,
  calculatePreparedness,
  calculateVelocityDrop,
  calculateVelocityTrend,
} from './velocity-profile';
export type {
  VelocityDataPoint,
  LinearRegressionResult,
  RegressionLinePoint,
  VelocityProfileRow,
  PreparednessResult,
  WeightedVelocitySet,
  WeeklyVelocityPoint,
  VelocityTrendResult,
} from './types';
