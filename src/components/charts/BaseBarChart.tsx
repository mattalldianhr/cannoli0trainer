'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface BarConfig {
  dataKey: string;
  label: string;
  color?: string;
  stackId?: string;
}

interface BaseBarChartProps {
  data: Record<string, unknown>[];
  bars: BarConfig[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  className?: string;
  formatXAxis?: (value: string) => string;
}

const DEFAULT_COLORS = [
  '#1d4ed8', // primary blue
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // violet
  '#0891b2', // cyan
];

export function BaseBarChart({
  data,
  bars,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  className,
  formatXAxis,
}: BaseBarChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ height }}>
        Not enough data yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxis}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fontSize: 12 } : undefined}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 12 } : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '0.375rem',
              fontSize: 12,
            }}
          />
          {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {bars.map((bar, i) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.label}
              fill={bar.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              stackId={bar.stackId}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
