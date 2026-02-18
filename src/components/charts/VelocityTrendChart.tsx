'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { VelocityTrendResult } from '@/lib/vbt';
import { AlertTriangle } from 'lucide-react';

interface VelocityTrendChartProps {
  trend: VelocityTrendResult;
  height?: number;
  className?: string;
}

function formatWeek(value: string) {
  const d = new Date(value + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { week: string; meanVelocity: number; setCount: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">Week of {formatWeek(point.week)}</p>
      <p>Mean velocity: {point.meanVelocity.toFixed(3)} m/s</p>
      <p className="text-muted-foreground">{point.setCount} sets in bracket</p>
    </div>
  );
}

export function VelocityTrendChart({
  trend,
  height = 280,
  className,
}: VelocityTrendChartProps) {
  const { weeklyPoints, latestWeekOverWeekChange, alert } = trend;

  // Calculate Y-axis domain with some padding
  const velocities = weeklyPoints.map((p) => p.meanVelocity);
  const minV = Math.min(...velocities);
  const maxV = Math.max(...velocities);
  const padding = (maxV - minV) * 0.15 || 0.02;

  return (
    <div className={cn('space-y-3', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={weeklyPoints} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            tickFormatter={formatWeek}
            label={{ value: 'Week', position: 'insideBottom', offset: -5, fontSize: 12 }}
          />
          <YAxis
            domain={[
              Math.round((minV - padding) * 1000) / 1000,
              Math.round((maxV + padding) * 1000) / 1000,
            ]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Reference line at the mean for visual comparison */}
          <ReferenceLine
            y={Math.round((velocities.reduce((s, v) => s + v, 0) / velocities.length) * 1000) / 1000}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'avg', position: 'right', fontSize: 10, fill: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="meanVelocity"
            name="Mean Velocity"
            stroke={alert ? '#d97706' : '#1d4ed8'}
            strokeWidth={2}
            dot={{ r: 4, fill: alert ? '#d97706' : '#1d4ed8' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Week-over-week change indicator */}
      <div className="flex items-center gap-3 text-sm px-2">
        {latestWeekOverWeekChange !== null && (
          <span
            className={cn(
              'font-medium tabular-nums',
              alert ? 'text-amber-600' : latestWeekOverWeekChange < 0 ? 'text-muted-foreground' : 'text-emerald-600'
            )}
          >
            {latestWeekOverWeekChange > 0 ? '+' : ''}
            {latestWeekOverWeekChange.toFixed(1)}% week-over-week
          </span>
        )}
        {alert && (
          <span className="flex items-center gap-1 text-amber-600 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Possible overreaching — velocity declined &gt;5%
          </span>
        )}
      </div>
    </div>
  );
}
