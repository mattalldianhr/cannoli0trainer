'use client';

import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  linearRegression,
  regressionLinePoints,
  type VelocityDataPoint,
} from '@/lib/vbt';

interface LoadVelocityChartProps {
  data: VelocityDataPoint[];
  height?: number;
  className?: string;
  showRegression?: boolean;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: VelocityDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{point.weight.toFixed(1)} kg @ {point.velocity.toFixed(2)} m/s</p>
      {point.date && (
        <p className="text-muted-foreground">
          {new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
      {point.rpe != null && <p className="text-muted-foreground">RPE {point.rpe}</p>}
    </div>
  );
}

export function LoadVelocityChart({
  data,
  height = 350,
  className,
  showRegression = true,
}: LoadVelocityChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground text-sm', className)}
        style={{ height }}
      >
        No velocity data yet
      </div>
    );
  }

  const regression = showRegression ? linearRegression(data) : null;
  const trendLine = regression ? regressionLinePoints(data, regression) : [];

  // Merge scatter data and trend line into one dataset for ComposedChart
  // Scatter points have scatterVelocity, trend line points have trendVelocity
  const scatterData = data.map((d) => ({
    ...d,
    scatterVelocity: d.velocity,
  }));

  const combinedData = [
    ...scatterData,
    ...trendLine.map((p) => ({
      weight: p.weight,
      trendVelocity: p.velocity,
    })),
  ].sort((a, b) => a.weight - b.weight);

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-2">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="weight"
              type="number"
              tick={{ fontSize: 12 }}
              label={{ value: 'Load (kg)', position: 'insideBottom', offset: -5, fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <YAxis
              dataKey="scatterVelocity"
              type="number"
              tick={{ fontSize: 12 }}
              label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Sets"
              dataKey="scatterVelocity"
              fill="#1d4ed8"
              fillOpacity={0.7}
              r={5}
            />
            {regression && trendLine.length === 2 && (
              <Line
                dataKey="trendVelocity"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={false}
                connectNulls={false}
                legendType="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Regression stats */}
        {regression && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-red-600" style={{ borderTop: '2px dashed #dc2626' }} />
              Trend line
            </span>
            <span>R² = {regression.rSquared.toFixed(3)}</span>
            <span>Slope = {regression.slope.toFixed(4)} m/s/kg</span>
          </div>
        )}
      </div>
    </div>
  );
}
