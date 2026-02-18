'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BaseLineChart } from '@/components/charts/BaseLineChart';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import { LoadVelocityChart } from '@/components/charts/LoadVelocityChart';
import { VelocityProfileTable } from '@/components/charts/VelocityProfileTable';
import { PreparednessIndicator } from '@/components/charts/PreparednessIndicator';
import {
  buildVelocityProfile,
  calculatePreparedness,
  calculateVelocityDrop,
} from '@/lib/vbt';
import {
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  Activity,
  Scale,
  Loader2,
  Download,
  Gauge,
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
  exercises: { id: string; name: string; count: number }[];
}

interface RPEAccuracyData {
  averageDeviation: number;
  setsAnalyzed: number;
  weeklyTrend: { weekStart: string; avgDeviation: number; setsAnalyzed: number }[];
}

interface BodyweightPoint {
  date: string;
  weight: number;
  unit: string;
}

interface VBTExercise {
  exerciseId: string;
  exerciseName: string;
  dataPointCount: number;
  sessionCount: number;
}

interface VBTExerciseData {
  exerciseId: string;
  exerciseName: string;
  dataPoints: { weight: number; velocity: number; date: string; reps?: number; rpe?: number }[];
  sessionVelocities: { date: string; velocities: number[] }[];
  estimated1RM: number | null;
}

interface VBTData {
  hasData: boolean;
  exercises: VBTExercise[];
  byExercise: Record<string, VBTExerciseData>;
}

interface AnalyticsData {
  athleteId: string;
  athleteName: string;
  e1rmTrends: E1RMTrend[];
  volumeByWeek: VolumeWeek[];
  compliance: Compliance;
  rpeDistribution: RPEDistribution;
  rpeAccuracy: RPEAccuracyData | null;
  bodyweightTrend: BodyweightPoint[];
  vbt: VBTData;
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
  /** Hide the athlete selector and CSV export — used when embedded on athlete profile */
  compact?: boolean;
}

export function AnalyticsDashboard({ athletes, initialAthleteId, compact }: AnalyticsDashboardProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialAthleteId ?? athletes[0]?.id ?? ''
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>('12w');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vbtExerciseId, setVbtExerciseId] = useState<string>('');
  const [rpeExerciseId, setRpeExerciseId] = useState<string>('');

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
      if (rpeExerciseId) {
        params.set('rpeExerciseId', rpeExerciseId);
      }

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
  }, [selectedAthleteId, dateRange, rpeExerciseId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Reset RPE exercise filter when athlete changes
  useEffect(() => {
    setRpeExerciseId('');
  }, [selectedAthleteId]);

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

  // Auto-select the first VBT exercise when data changes
  useEffect(() => {
    if (data?.vbt?.hasData && data.vbt.exercises.length > 0) {
      setVbtExerciseId((prev) => {
        if (prev && data.vbt.byExercise[prev]) return prev;
        return data.vbt.exercises[0].exerciseId;
      });
    } else {
      setVbtExerciseId('');
    }
  }, [data]);

  // Compute VBT derived data for the selected exercise
  const vbtComputed = useMemo(() => {
    if (!data?.vbt?.hasData || !vbtExerciseId || !data.vbt.byExercise[vbtExerciseId]) {
      return null;
    }

    const exerciseData = data.vbt.byExercise[vbtExerciseId];
    const dataPoints = exerciseData.dataPoints;
    const e1rm = exerciseData.estimated1RM;

    // Velocity profile (requires e1RM for %1RM bucketing)
    const velocityProfile = e1rm ? buildVelocityProfile(dataPoints, e1rm) : [];

    // Preparedness: compare latest session to older sessions
    const sessions = exerciseData.sessionVelocities;
    let preparedness = null;
    if (sessions.length >= 2) {
      const latestSession = sessions[sessions.length - 1];
      const baselineSessions = sessions.slice(0, -1);

      const recentDataPoints = latestSession.velocities.map((v, i) => ({
        weight: dataPoints.find(
          (dp) => dp.date === latestSession.date
        )?.weight ?? 0,
        velocity: v,
        date: latestSession.date,
      }));

      // Build baseline data from all prior sessions
      const baselineDataPoints = baselineSessions.flatMap((s) =>
        s.velocities.map((v) => {
          const matching = dataPoints.find((dp) => dp.date === s.date);
          return {
            weight: matching?.weight ?? 0,
            velocity: v,
            date: s.date,
          };
        })
      );

      preparedness = calculatePreparedness(recentDataPoints, baselineDataPoints);
    }

    // Velocity drop for the latest session
    const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    const velocityDrop = latestSession ? calculateVelocityDrop(latestSession.velocities) : null;

    return {
      exerciseData,
      velocityProfile,
      preparedness,
      velocityDrop,
      latestSessionDate: latestSession?.date ?? null,
    };
  }, [data, vbtExerciseId]);

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
        {!compact && (
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
        )}

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
          {!compact && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!selectedAthleteId}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          )}
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

          {/* RPE Distribution & Accuracy */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  RPE Distribution
                </CardTitle>
                {data.rpeDistribution.exercises && data.rpeDistribution.exercises.length > 0 && (
                  <select
                    value={rpeExerciseId}
                    onChange={(e) => setRpeExerciseId(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">All Exercises</option>
                    {data.rpeDistribution.exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.count} sets)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.rpeDistribution.totalSetsWithRPE === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No RPE data recorded yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* RPE Accuracy Metric */}
                  {data.rpeAccuracy && (
                    <div className="rounded-md border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">RPE Accuracy</h4>
                        <Badge variant="outline" className="text-xs">
                          {data.rpeAccuracy.setsAnalyzed} sets analyzed
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tabular-nums">
                          {data.rpeAccuracy.averageDeviation === 0
                            ? 'Perfect'
                            : `±${data.rpeAccuracy.averageDeviation}`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.rpeAccuracy.averageDeviation === 0
                            ? 'match'
                            : 'RPE avg deviation'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Compares self-reported RPE to estimated RPE based on load/reps relative to known 1RM
                      </p>
                    </div>
                  )}

                  {/* RPE Histogram */}
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

                  {/* RPE Accuracy Trend */}
                  {data.rpeAccuracy && data.rpeAccuracy.weeklyTrend.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">RPE Accuracy Trend</h4>
                      <BaseLineChart
                        data={data.rpeAccuracy.weeklyTrend.map(w => ({ ...w }))}
                        lines={[{ dataKey: 'avgDeviation', label: 'Avg Deviation', color: '#dc2626' }]}
                        xAxisKey="weekStart"
                        yAxisLabel="RPE ±"
                        height={200}
                        formatXAxis={formatWeek}
                      />
                    </div>
                  )}

                  {/* Weekly Avg RPE */}
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

          {/* VBT Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Velocity-Based Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data.vbt?.hasData ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No velocity data yet. Log velocity (m/s) per set in the training log to see VBT analytics.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Exercise selector */}
                  <div className="flex items-center gap-3">
                    <label htmlFor="vbt-exercise-select" className="text-sm font-medium whitespace-nowrap">
                      Exercise:
                    </label>
                    <select
                      id="vbt-exercise-select"
                      value={vbtExerciseId}
                      onChange={(e) => setVbtExerciseId(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {data.vbt.exercises.map((ex) => (
                        <option key={ex.exerciseId} value={ex.exerciseId}>
                          {ex.exerciseName} ({ex.dataPointCount} sets, {ex.sessionCount} sessions)
                        </option>
                      ))}
                    </select>
                  </div>

                  {vbtComputed && (
                    <>
                      {/* Load-Velocity Scatter Chart */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Load-Velocity Profile</h4>
                        <LoadVelocityChart
                          data={vbtComputed.exerciseData.dataPoints}
                          height={350}
                        />
                      </div>

                      {/* Preparedness + Fatigue row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Preparedness</h4>
                          <PreparednessIndicator result={vbtComputed.preparedness} />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-3">Session Fatigue</h4>
                          {vbtComputed.velocityDrop !== null ? (
                            <div className="rounded-md border p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                  Velocity drop (last session)
                                </span>
                                <span className="text-sm font-medium tabular-nums">
                                  {vbtComputed.latestSessionDate && formatDate(vbtComputed.latestSessionDate)}
                                </span>
                              </div>
                              <div className="text-2xl font-bold tabular-nums">
                                {vbtComputed.velocityDrop.toFixed(1)}%
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Velocity decrease from set 1 to final set
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-muted-foreground text-sm py-8">
                              Need 2+ sets in a session to calculate fatigue.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Velocity Profile Table */}
                      {vbtComputed.velocityProfile.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">
                            Velocity Profile
                            {vbtComputed.exerciseData.estimated1RM && (
                              <span className="text-muted-foreground font-normal ml-2">
                                (est. 1RM: {vbtComputed.exerciseData.estimated1RM.toFixed(1)} kg)
                              </span>
                            )}
                          </h4>
                          <VelocityProfileTable rows={vbtComputed.velocityProfile} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
