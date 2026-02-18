'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BaseLineChart } from '@/components/charts/BaseLineChart';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import {
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  Activity,
  Scale,
  Loader2,
  Download,
} from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
}

interface E1RMTrend {
  exerciseId: string;
  exerciseName: string;
  dataPoints: { date: string; e1rm: number }[];
}

interface VolumeWeek {
  weekStart: string;
  totalSets: number;
  totalReps: number;
  totalTonnage: number;
}

interface Compliance {
  totalSessions: number;
  completed: number;
  partiallyCompleted: number;
  notStarted: number;
  complianceRate: number;
  avgCompletionPercentage: number;
  weeklyTrend: { weekStart: string; total: number; completed: number; rate: number }[];
}

interface RPEDistribution {
  totalSetsWithRPE: number;
  averageRPE: number | null;
  distribution: { rpe: number; count: number }[];
  weeklyTrend: { weekStart: string; avgRPE: number; setCount: number }[];
}

interface BodyweightPoint {
  date: string;
  weight: number;
  unit: string;
}

interface AnalyticsData {
  athleteId: string;
  athleteName: string;
  e1rmTrends: E1RMTrend[];
  volumeByWeek: VolumeWeek[];
  compliance: Compliance;
  rpeDistribution: RPEDistribution;
  bodyweightTrend: BodyweightPoint[];
}

const DATE_RANGES = [
  { label: '4 Weeks', value: '4w', weeks: 4 },
  { label: '8 Weeks', value: '8w', weeks: 8 },
  { label: '12 Weeks', value: '12w', weeks: 12 },
  { label: 'All Time', value: 'all', weeks: 0 },
] as const;

type DateRangeValue = (typeof DATE_RANGES)[number]['value'];

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface AnalyticsDashboardProps {
  athletes: Athlete[];
  initialAthleteId?: string;
}

export function AnalyticsDashboard({ athletes, initialAthleteId }: AnalyticsDashboardProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialAthleteId ?? athletes[0]?.id ?? ''
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>('12w');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedAthleteId) return;

    setLoading(true);
    setError(null);

    try {
      const rangeConfig = DATE_RANGES.find(r => r.value === dateRange);
      const params = new URLSearchParams();

      if (rangeConfig && rangeConfig.weeks > 0) {
        const from = new Date();
        from.setDate(from.getDate() - rangeConfig.weeks * 7);
        params.set('from', from.toISOString().split('T')[0]);
      }
      params.set('to', new Date().toISOString().split('T')[0]);

      const res = await fetch(`/api/analytics/${selectedAthleteId}?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedAthleteId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = useCallback(() => {
    if (!selectedAthleteId) return;

    const rangeConfig = DATE_RANGES.find(r => r.value === dateRange);
    const params = new URLSearchParams();

    if (rangeConfig && rangeConfig.weeks > 0) {
      const from = new Date();
      from.setDate(from.getDate() - rangeConfig.weeks * 7);
      params.set('from', from.toISOString().split('T')[0]);
    }
    params.set('to', new Date().toISOString().split('T')[0]);

    window.location.href = `/api/analytics/${selectedAthleteId}/export?${params.toString()}`;
  }, [selectedAthleteId, dateRange]);

  if (athletes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No athletes yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Add athletes and log training data to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="athlete-select" className="text-sm font-medium whitespace-nowrap">
            Athlete:
          </label>
          <select
            id="athlete-select"
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!selectedAthleteId}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchAnalytics}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sessions
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.compliance.totalSessions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Compliance
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.compliance.complianceRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg RPE
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.rpeDistribution.averageRPE ?? '—'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lifts Tracked
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.e1rmTrends.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* E1RM Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estimated 1RM Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.e1rmTrends.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  Not enough data yet. Log training with RPE or track PRs to see 1RM trends.
                </div>
              ) : (
                <div className="space-y-6">
                  {data.e1rmTrends.slice(0, 6).map((trend) => (
                    <div key={trend.exerciseId}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium">{trend.exerciseName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {trend.dataPoints.length} data points
                        </Badge>
                      </div>
                      <BaseLineChart
                        data={trend.dataPoints.map(d => ({ ...d }))}
                        lines={[{ dataKey: 'e1rm', label: 'Est. 1RM (kg)' }]}
                        xAxisKey="date"
                        yAxisLabel="kg"
                        height={200}
                        formatXAxis={formatDate}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume by Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Weekly Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BaseBarChart
                data={data.volumeByWeek.map((w) => ({
                  weekStart: w.weekStart,
                  tonnageDisplay: Math.round(w.totalTonnage),
                }))}
                bars={[{ dataKey: 'tonnageDisplay', label: 'Tonnage (kg)' }]}
                xAxisKey="weekStart"
                yAxisLabel="kg"
                height={300}
                formatXAxis={formatWeek}
              />
            </CardContent>
          </Card>

          {/* Compliance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Weekly Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BaseBarChart
                data={data.compliance.weeklyTrend.map(w => ({ ...w }))}
                bars={[{ dataKey: 'rate', label: 'Compliance %' }]}
                xAxisKey="weekStart"
                yAxisLabel="%"
                height={250}
                formatXAxis={formatWeek}
              />
            </CardContent>
          </Card>

          {/* RPE Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                RPE Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.rpeDistribution.totalSetsWithRPE === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No RPE data recorded yet.
                </div>
              ) : (
                <div className="space-y-6">
                  <BaseBarChart
                    data={data.rpeDistribution.distribution.map((d) => ({
                      rpe: String(d.rpe),
                      count: d.count,
                    }))}
                    bars={[{ dataKey: 'count', label: 'Sets', color: '#7c3aed' }]}
                    xAxisKey="rpe"
                    xAxisLabel="RPE"
                    yAxisLabel="Sets"
                    height={200}
                  />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Weekly Avg RPE</h4>
                    <BaseLineChart
                      data={data.rpeDistribution.weeklyTrend.map(w => ({ ...w }))}
                      lines={[{ dataKey: 'avgRPE', label: 'Avg RPE', color: '#7c3aed' }]}
                      xAxisKey="weekStart"
                      yAxisLabel="RPE"
                      height={200}
                      formatXAxis={formatWeek}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bodyweight Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Bodyweight Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.bodyweightTrend.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No bodyweight data recorded yet.
                </div>
              ) : (
                <BaseLineChart
                  data={data.bodyweightTrend.map(d => ({ ...d }))}
                  lines={[{ dataKey: 'weight', label: `Weight (${data.bodyweightTrend[0]?.unit ?? 'kg'})` }]}
                  xAxisKey="date"
                  yAxisLabel={data.bodyweightTrend[0]?.unit ?? 'kg'}
                  height={250}
                  formatXAxis={formatDate}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
