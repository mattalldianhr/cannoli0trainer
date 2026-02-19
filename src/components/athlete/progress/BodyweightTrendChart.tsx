'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseLineChart } from '@/components/charts/BaseLineChart';
import { Badge } from '@/components/ui/badge';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BodyweightTrendChartProps {
  bodyweight: { date: string; weight: number }[];
  weightClass?: string | null;
}

/**
 * Standard IPF weight classes in kg.
 * Used to draw a target reference line when the athlete has a weightClass set.
 */
const WEIGHT_CLASS_MAP: Record<string, number> = {
  '52': 52,
  '56': 56,
  '60': 60,
  '67.5': 67.5,
  '75': 75,
  '82.5': 82.5,
  '83': 83,
  '90': 90,
  '93': 93,
  '100': 100,
  '105': 105,
  '110': 110,
  '120': 120,
  '120+': 120,
  '140': 140,
  '140+': 140,
};

function parseWeightClassTarget(weightClass: string | null | undefined): number | null {
  if (!weightClass) return null;
  const cleaned = weightClass.trim().toLowerCase().replace('kg', '').trim();
  if (WEIGHT_CLASS_MAP[cleaned]) return WEIGHT_CLASS_MAP[cleaned];
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BodyweightTrendChart({
  bodyweight,
  weightClass,
}: BodyweightTrendChartProps) {
  const target = useMemo(() => parseWeightClassTarget(weightClass), [weightClass]);

  const currentWeight = bodyweight[bodyweight.length - 1]?.weight ?? 0;

  // Trend: compare first and last entry
  const trend = useMemo(() => {
    if (bodyweight.length < 2) return null;
    const first = bodyweight[0].weight;
    const last = bodyweight[bodyweight.length - 1].weight;
    const diff = last - first;
    const absDiff = Math.abs(diff);

    if (absDiff < 0.1) return { direction: 'flat' as const, value: '0.0' };
    return {
      direction: diff > 0 ? ('up' as const) : ('down' as const),
      value: absDiff.toFixed(1),
    };
  }, [bodyweight]);

  // Add target line as a second data series if weight class is set
  const chartData = useMemo(() => {
    if (!target) {
      return bodyweight.map((d) => ({ ...d }));
    }
    return bodyweight.map((d) => ({
      ...d,
      target,
    }));
  }, [bodyweight, target]);

  const lines = useMemo(() => {
    const result = [{ dataKey: 'weight', label: 'Bodyweight (kg)', color: '#1d4ed8' }];
    if (target) {
      result.push({ dataKey: 'target', label: `Weight Class (${weightClass})`, color: '#d97706' });
    }
    return result;
  }, [target, weightClass]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5" />
          Bodyweight Trend
        </CardTitle>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-2xl font-bold tabular-nums">
            {currentWeight.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">kg</span>
          {trend && (
            <Badge
              variant="outline"
              className={
                trend.direction === 'up'
                  ? 'text-amber-600 border-amber-200'
                  : trend.direction === 'down'
                    ? 'text-emerald-600 border-emerald-200'
                    : 'text-muted-foreground'
              }
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend.direction === 'flat' && <Minus className="h-3 w-3 mr-1" />}
              {trend.value} kg
            </Badge>
          )}
          {target && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Target: {target} kg
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <BaseLineChart
          data={chartData}
          lines={lines}
          xAxisKey="date"
          yAxisLabel="kg"
          height={250}
          formatXAxis={formatDate}
        />
      </CardContent>
    </Card>
  );
}
