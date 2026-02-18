'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BaseLineChart } from '@/components/charts/BaseLineChart';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import { Users, Loader2, TrendingUp, Dumbbell, CheckCircle2 } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
}

const COMPARISON_COLORS = ['#1d4ed8', '#059669', '#d97706'] as const;

const METRICS = [
  { value: 'e1rm', label: 'Est. 1RM', icon: TrendingUp },
  { value: 'volume', label: 'Volume', icon: Dumbbell },
  { value: 'compliance', label: 'Compliance', icon: CheckCircle2 },
] as const;

type MetricValue = (typeof METRICS)[number]['value'];

const DATE_RANGES = [
  { label: '4 Weeks', value: '4w', weeks: 4 },
  { label: '8 Weeks', value: '8w', weeks: 8 },
  { label: '12 Weeks', value: '12w', weeks: 12 },
  { label: 'All Time', value: 'all', weeks: 0 },
] as const;

type DateRangeValue = (typeof DATE_RANGES)[number]['value'];

interface E1RMTrend {
  exerciseId: string;
  exerciseName: string;
  dataPoints: { date: string; e1rm: number }[];
}

interface VolumeWeek {
  weekStart: string;
  totalTonnage: number;
}

interface ComplianceWeek {
  weekStart: string;
  total: number;
  completed: number;
  rate: number;
}

interface ComparisonResponse {
  athletes: { id: string; name: string }[];
  metric: string;
  athleteData: {
    athleteId: string;
    athleteName: string;
    data: E1RMTrend[] | VolumeWeek[] | ComplianceWeek[];
  }[];
  exercises: { id: string; name: string }[];
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface AthleteComparisonViewProps {
  athletes: Athlete[];
}

export function AthleteComparisonView({ athletes }: AthleteComparisonViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metric, setMetric] = useState<MetricValue>('e1rm');
  const [dateRange, setDateRange] = useState<DateRangeValue>('12w');
  const [exerciseId, setExerciseId] = useState<string>('');
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAthlete = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        if (prev.length >= 3) return prev;
        return [...prev, id];
      });
    },
    []
  );

  const fetchComparison = useCallback(async () => {
    if (selectedIds.length < 2) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rangeConfig = DATE_RANGES.find((r) => r.value === dateRange);
      const params = new URLSearchParams();
      params.set('athleteIds', selectedIds.join(','));
      params.set('metric', metric);

      if (rangeConfig && rangeConfig.weeks > 0) {
        const from = new Date();
        from.setDate(from.getDate() - rangeConfig.weeks * 7);
        params.set('from', from.toISOString().split('T')[0]);
      }
      params.set('to', new Date().toISOString().split('T')[0]);

      if (exerciseId && metric === 'e1rm') {
        params.set('exerciseId', exerciseId);
      }

      const res = await fetch(`/api/analytics/compare?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch comparison: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, metric, dateRange, exerciseId]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // Reset exercise filter when metric changes away from e1rm
  useEffect(() => {
    if (metric !== 'e1rm') {
      setExerciseId('');
    }
  }, [metric]);

  // Build chart data for the selected metric
  const chartContent = useMemo(() => {
    if (!data || data.athleteData.length < 2) return null;

    if (metric === 'e1rm') {
      return renderE1RMComparison(data);
    }
    if (metric === 'volume') {
      return renderVolumeComparison(data);
    }
    if (metric === 'compliance') {
      return renderComplianceComparison(data);
    }
    return null;
  }, [data, metric]);

  if (athletes.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Need at least 2 athletes for comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Athlete Multi-Select */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Select Athletes to Compare (2-3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {athletes.map((athlete) => {
              const isSelected = selectedIds.includes(athlete.id);
              const idx = selectedIds.indexOf(athlete.id);
              const color = idx >= 0 ? COMPARISON_COLORS[idx] : undefined;

              return (
                <button
                  key={athlete.id}
                  onClick={() => toggleAthlete(athlete.id)}
                  disabled={!isSelected && selectedIds.length >= 3}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                    isSelected
                      ? 'text-white border-transparent'
                      : 'bg-background text-foreground border-input hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  {isSelected && (
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-white/60"
                    />
                  )}
                  {athlete.name}
                </button>
              );
            })}
          </div>
          {selectedIds.length < 2 && (
            <p className="text-xs text-muted-foreground mt-2">
              Select at least 2 athletes to compare.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Controls: metric + date range + exercise filter */}
      {selectedIds.length >= 2 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1">
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <Button
                  key={m.value}
                  variant={metric === m.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetric(m.value)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {m.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {metric === 'e1rm' && data?.exercises && data.exercises.length > 0 && (
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">All Exercises</option>
                {data.exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              {DATE_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={dateRange === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && selectedIds.length >= 2 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchComparison}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {!loading && !error && chartContent}
    </div>
  );
}

function renderE1RMComparison(data: ComparisonResponse) {
  // For e1rm, each athlete has an array of exercise trends.
  // Find exercises that at least 2 athletes share data for.
  const exerciseTrendsByAthlete = data.athleteData as {
    athleteId: string;
    athleteName: string;
    data: E1RMTrend[];
  }[];

  // Collect all exercise IDs with data from at least 2 athletes
  const exerciseCount: Record<string, { name: string; count: number }> = {};
  for (const ad of exerciseTrendsByAthlete) {
    for (const trend of ad.data) {
      if (!exerciseCount[trend.exerciseId]) {
        exerciseCount[trend.exerciseId] = { name: trend.exerciseName, count: 0 };
      }
      exerciseCount[trend.exerciseId].count += 1;
    }
  }

  const sharedExercises = Object.entries(exerciseCount)
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({ id, name: v.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (sharedExercises.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No shared exercise data between the selected athletes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sharedExercises.slice(0, 6).map((exercise) => {
        // Merge all athletes' data points for this exercise into a single dataset
        // keyed by date, with separate columns per athlete
        const dateMap: Record<string, Record<string, number>> = {};

        exerciseTrendsByAthlete.forEach((ad) => {
          const trend = ad.data.find((t) => t.exerciseId === exercise.id);
          if (!trend) return;
          for (const dp of trend.dataPoints) {
            if (!dateMap[dp.date]) dateMap[dp.date] = {};
            dateMap[dp.date][ad.athleteName] = dp.e1rm;
          }
        });

        const merged = Object.entries(dateMap)
          .map(([date, values]) => ({ date, ...values }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const lines = data.athletes.map((a, i) => ({
          dataKey: a.name,
          label: a.name,
          color: COMPARISON_COLORS[i],
        }));

        return (
          <Card key={exercise.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {exercise.name}
                <Badge variant="outline" className="text-xs font-normal">
                  Est. 1RM
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BaseLineChart
                data={merged}
                lines={lines}
                xAxisKey="date"
                yAxisLabel="kg"
                height={280}
                formatXAxis={formatDate}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function renderVolumeComparison(data: ComparisonResponse) {
  const volumeByAthlete = data.athleteData as {
    athleteId: string;
    athleteName: string;
    data: VolumeWeek[];
  }[];

  // Merge all weeks into a unified dataset
  const weekMap: Record<string, Record<string, number>> = {};
  for (const ad of volumeByAthlete) {
    for (const week of ad.data) {
      if (!weekMap[week.weekStart]) weekMap[week.weekStart] = {};
      weekMap[week.weekStart][ad.athleteName] = Math.round(week.totalTonnage);
    }
  }

  const merged = Object.entries(weekMap)
    .map(([weekStart, values]) => ({ weekStart, ...values }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  if (merged.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No volume data for the selected athletes.
        </CardContent>
      </Card>
    );
  }

  const bars = data.athletes.map((a, i) => ({
    dataKey: a.name,
    label: a.name,
    color: COMPARISON_COLORS[i],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Weekly Volume Comparison
          <Badge variant="outline" className="text-xs font-normal">
            Tonnage (kg)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={merged}
          bars={bars}
          xAxisKey="weekStart"
          yAxisLabel="kg"
          height={350}
          formatXAxis={formatWeek}
        />
      </CardContent>
    </Card>
  );
}

function renderComplianceComparison(data: ComparisonResponse) {
  const complianceByAthlete = data.athleteData as {
    athleteId: string;
    athleteName: string;
    data: ComplianceWeek[];
  }[];

  // Merge weeks
  const weekMap: Record<string, Record<string, number>> = {};
  for (const ad of complianceByAthlete) {
    for (const week of ad.data) {
      if (!weekMap[week.weekStart]) weekMap[week.weekStart] = {};
      weekMap[week.weekStart][ad.athleteName] = week.rate;
    }
  }

  const merged = Object.entries(weekMap)
    .map(([weekStart, values]) => ({ weekStart, ...values }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  if (merged.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No compliance data for the selected athletes.
        </CardContent>
      </Card>
    );
  }

  const lines = data.athletes.map((a, i) => ({
    dataKey: a.name,
    label: a.name,
    color: COMPARISON_COLORS[i],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Weekly Compliance Comparison
          <Badge variant="outline" className="text-xs font-normal">
            %
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BaseLineChart
          data={merged}
          lines={lines}
          xAxisKey="weekStart"
          yAxisLabel="%"
          height={350}
          formatXAxis={formatWeek}
        />
      </CardContent>
    </Card>
  );
}
