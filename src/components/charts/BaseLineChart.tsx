'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface LineConfig {
  dataKey: string;
  label: string;
  color?: string;
}

interface BaseLineChartProps {
  data: Record<string, unknown>[];
  lines: LineConfig[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yDomain?: [number | string, number | string];
  yTickCount?: number;
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

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: '0.375rem',
  fontSize: 12,
};

export function BaseLineChart({
  data,
  lines,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  yDomain,
  yTickCount,
  height = 300,
  className,
  formatXAxis,
}: BaseLineChartProps) {
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
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxis}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fontSize: 12 } : undefined}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={yDomain}
            tickCount={yTickCount}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 12 } : undefined}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {lines.map((line, i) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label}
              stroke={line.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
