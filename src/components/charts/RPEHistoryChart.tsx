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

export interface RPEDataPoint {
  date: string;
  rpe: number;
  weight: number;
  reps: number;
  exerciseName: string;
}

interface RPETrendPoint {
  date: string;
  avgRPE: number;
}

interface RPEHistoryChartProps {
  dataPoints: RPEDataPoint[];
  trendLine: RPETrendPoint[];
  height?: number;
  className?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown>; dataKey: string }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Find the scatter point payload (has exerciseName)
  const scatterEntry = payload.find((p) => p.dataKey === 'scatterRPE');
  if (scatterEntry) {
    const point = scatterEntry.payload;
    const rpe = point.rpe as number;
    const rir = 10 - rpe;
    const rirStr = Number.isInteger(rir) ? String(rir) : rir.toFixed(1);
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
        <p className="font-medium">RPE {rpe} / {rirStr} RIR</p>
        <p className="text-muted-foreground">{point.exerciseName as string}</p>
        <p className="text-muted-foreground">
          {point.weight as number} kg × {point.reps as number} reps
        </p>
        <p className="text-muted-foreground">{formatDate(point.date as string)}</p>
      </div>
    );
  }

  // Trend line point
  const trendEntry = payload.find((p) => p.dataKey === 'trendRPE');
  if (trendEntry) {
    const point = trendEntry.payload;
    const avgRPE = point.trendRPE as number;
    const avgRIR = (10 - avgRPE).toFixed(1);
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
        <p className="font-medium">Moving Avg: RPE {avgRPE.toFixed(1)} / {avgRIR} RIR</p>
        <p className="text-muted-foreground">{formatDate(point.date as string)}</p>
      </div>
    );
  }

  return null;
}

export function RPEHistoryChart({
  dataPoints,
  trendLine,
  height = 300,
  className,
}: RPEHistoryChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground text-sm', className)}
        style={{ height }}
      >
        No RPE data yet
      </div>
    );
  }

  // Assign a sequential index so scatter and trend share the same x-axis positioning
  const scatterData = dataPoints.map((d, i) => ({
    ...d,
    idx: i,
    scatterRPE: d.rpe,
  }));

  const trendData = trendLine.map((d, i) => ({
    ...d,
    idx: i,
    trendRPE: d.avgRPE,
  }));

  // Merge scatter + trend into one dataset keyed by index
  const mergedMap = new Map<number, Record<string, unknown>>();
  for (const point of scatterData) {
    mergedMap.set(point.idx, { ...point });
  }
  for (const point of trendData) {
    const existing = mergedMap.get(point.idx) ?? { idx: point.idx };
    mergedMap.set(point.idx, { ...existing, trendRPE: point.trendRPE });
  }

  const combinedData = Array.from(mergedMap.values()).sort(
    (a, b) => (a.idx as number) - (b.idx as number)
  );

  // Calculate x-axis tick positions (show ~8 date labels evenly spaced)
  const tickCount = Math.min(8, combinedData.length);
  const step = Math.max(1, Math.floor(combinedData.length / tickCount));
  const ticks: number[] = [];
  for (let i = 0; i < combinedData.length; i += step) {
    ticks.push(i);
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={combinedData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="idx"
            type="number"
            domain={[0, combinedData.length - 1]}
            ticks={ticks}
            tickFormatter={(idx: number) => {
              const point = combinedData[idx];
              return point ? formatDate(point.date as string) : '';
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[5.5, 10.5]}
            ticks={[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]}
            tick={{ fontSize: 12 }}
            label={{ value: 'RPE', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name="Individual Sets"
            dataKey="scatterRPE"
            fill="#7c3aed"
            fillOpacity={0.5}
            r={4}
          />
          <Line
            dataKey="trendRPE"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls
            name="Moving Average"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-2 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-600 opacity-50" />
          Individual sets
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-violet-600" />
          Moving average
        </span>
        <span className="ml-auto">{dataPoints.length} sets with RPE</span>
      </div>
    </div>
  );
}
