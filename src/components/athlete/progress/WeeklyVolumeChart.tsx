'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatLocalDate } from '@/lib/date-utils';

interface WeeklyVolumeChartProps {
  weeklyVolume: { weekStart: string; tonnage: number }[];
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTonnage(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return formatLocalDate(d);
}

export function WeeklyVolumeChart({ weeklyVolume }: WeeklyVolumeChartProps) {
  const currentWeekStart = useMemo(() => getISOWeekStart(new Date()), []);

  // Calculate trend: compare last two weeks
  const trend = useMemo(() => {
    if (weeklyVolume.length < 2) return null;

    const lastTwo = weeklyVolume.slice(-2);
    const prev = lastTwo[0].tonnage;
    const curr = lastTwo[1].tonnage;

    if (prev === 0) return null;

    const pctChange = ((curr - prev) / prev) * 100;
    return {
      value: Math.abs(Math.round(pctChange)),
      direction: pctChange > 2 ? 'up' : pctChange < -2 ? 'down' : 'flat',
    } as const;
  }, [weeklyVolume]);

  // Split tonnage into two data keys so BaseBarChart renders different colors
  const chartData = useMemo(
    () =>
      weeklyVolume.map((w) => {
        const isCurrent = w.weekStart === currentWeekStart;
        return {
          weekStart: w.weekStart,
          pastTonnage: isCurrent ? 0 : w.tonnage,
          currentTonnage: isCurrent ? w.tonnage : 0,
        };
      }),
    [weeklyVolume, currentWeekStart]
  );

  if (weeklyVolume.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Training Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Complete workouts to see your weekly volume.
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestTonnage = weeklyVolume[weeklyVolume.length - 1]?.tonnage ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          Training Volume
        </CardTitle>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-2xl font-bold">{formatTonnage(latestTonnage)}</span>
          <span className="text-sm text-muted-foreground">kg this week</span>
          {trend && (
            <Badge
              variant="outline"
              className={
                trend.direction === 'up'
                  ? 'text-emerald-600 border-emerald-200'
                  : trend.direction === 'down'
                    ? 'text-red-600 border-red-200'
                    : 'text-muted-foreground'
              }
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend.direction === 'flat' && <Minus className="h-3 w-3 mr-1" />}
              {trend.value}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={chartData}
          bars={[
            { dataKey: 'pastTonnage', label: 'Past Weeks', color: '#1d4ed8' },
            { dataKey: 'currentTonnage', label: 'This Week', color: '#f97316' },
          ]}
          xAxisKey="weekStart"
          yAxisLabel="kg"
          height={250}
          formatXAxis={formatWeekLabel}
        />
      </CardContent>
    </Card>
  );
}
