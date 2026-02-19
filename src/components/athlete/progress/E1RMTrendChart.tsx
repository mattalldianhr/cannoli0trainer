'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseLineChart } from '@/components/charts/BaseLineChart';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface E1RMTrendChartProps {
  e1rmTrends: Record<string, { date: string; value: number }[]>;
  availableExercises: { id: string; name: string }[];
}

const COMPETITION_PATTERNS = [
  /squat/i,
  /bench/i,
  /deadlift/i,
];

function isCompetitionLift(name: string): boolean {
  return COMPETITION_PATTERNS.some((p) => p.test(name));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function E1RMTrendChart({
  e1rmTrends,
  availableExercises,
}: E1RMTrendChartProps) {
  // Filter to exercises that have trend data
  const exercisesWithData = useMemo(
    () => availableExercises.filter((ex) => e1rmTrends[ex.id]?.length > 0),
    [availableExercises, e1rmTrends]
  );

  // Default to first competition lift with data, or first available exercise
  const defaultExerciseId = useMemo(() => {
    const compLift = exercisesWithData.find((ex) => isCompetitionLift(ex.name));
    return compLift?.id ?? exercisesWithData[0]?.id ?? '';
  }, [exercisesWithData]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(defaultExerciseId);

  const selectedData = useMemo(() => {
    const data = e1rmTrends[selectedExerciseId] ?? [];
    return data.map((d) => ({ ...d }));
  }, [e1rmTrends, selectedExerciseId]);

  const selectedName = useMemo(
    () => exercisesWithData.find((ex) => ex.id === selectedExerciseId)?.name ?? '',
    [exercisesWithData, selectedExerciseId]
  );

  // Compute nice Y-axis domain: round min down and max up to nearest 10 or 20
  const yDomain = useMemo((): [number, number] | undefined => {
    if (selectedData.length === 0) return undefined;
    const values = selectedData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    // Pick step: 5kg increments for small ranges, 10 for medium, 20 for large
    const step = range < 30 ? 5 : range < 80 ? 10 : 20;
    const niceMin = Math.max(0, Math.floor(min / step) * step - step);
    const niceMax = Math.ceil(max / step) * step + step;
    return [niceMin, niceMax];
  }, [selectedData]);

  if (exercisesWithData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            Estimated 1RM Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Log training with RPE or track PRs to see 1RM trends.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Estimated 1RM Trends
        </CardTitle>
        <div className="pt-2">
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {exercisesWithData.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
                {isCompetitionLift(ex.name) ? ' *' : ''}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedName}
          </span>
          <Badge variant="outline" className="text-xs">
            {selectedData.length} data points
          </Badge>
        </div>
        <BaseLineChart
          data={selectedData}
          lines={[{ dataKey: 'value', label: 'Est. 1RM (kg)' }]}
          xAxisKey="date"
          yAxisLabel="kg"
          yDomain={yDomain}
          yTickCount={6}
          height={250}
          formatXAxis={formatDate}
        />
      </CardContent>
    </Card>
  );
}
