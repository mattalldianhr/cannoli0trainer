import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { estimateOneRMFromRPE } from '@/lib/rpe-table';
import { calculateRpeAccuracy, type RPEAccuracyInput } from '@/lib/analytics/rpe-accuracy';
import { formatPrismaDate } from '@/lib/date-utils';

/**
 * GET /api/analytics/[athleteId]
 *
 * Returns aggregated analytics data for an athlete:
 * - e1rmTrends: estimated 1RM over time per exercise (from MaxSnapshots + RPE-based estimation)
 * - volumeByWeek: weekly tonnage (sets × reps × weight)
 * - compliance: assigned vs completed workout percentage
 * - rpeDistribution: RPE value counts and average RPE per week
 * - bodyweightTrend: bodyweight over time
 *
 * Query params:
 * - from: ISO date string (start of range)
 * - to: ISO date string (end of range)
 * - exerciseId: filter 1RM trends to a specific exercise
 * - rpeExerciseId: filter RPE distribution to a specific exercise
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  try {
    const { athleteId } = await params;
    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const exerciseId = searchParams.get('exerciseId');
    const rpeExerciseId = searchParams.get('rpeExerciseId');

    // Validate athlete exists and belongs to current coach
    const coachId = await getCurrentCoachId();
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId, coachId },
      select: { id: true, name: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Build date range filter
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (from) dateRange.gte = new Date(from);
    if (to) dateRange.lte = new Date(to);
    const hasDateRange = from || to;

    // Run all queries in parallel
    const [
      e1rmTrends,
      volumeData,
      complianceData,
      rpeData,
      bodyweightData,
      vbtData,
      rpeHistory,
    ] = await Promise.all([
      getE1RMTrends(athleteId, dateRange, exerciseId),
      getVolumeByWeek(athleteId, dateRange),
      getCompliance(athleteId, dateRange, hasDateRange),
      getRPEDistribution(athleteId, dateRange, rpeExerciseId),
      getBodyweightTrend(athleteId, dateRange),
      getVBTData(athleteId, dateRange),
      getRPEHistory(athleteId, dateRange, rpeExerciseId),
    ]);

    // RPE accuracy requires MaxSnapshot e1RM data — computed from the RPE sets
    const rpeAccuracy = await getRPEAccuracy(athleteId, dateRange, rpeExerciseId);

    return NextResponse.json({
      athleteId,
      athleteName: athlete.name,
      dateRange: {
        from: from ?? null,
        to: to ?? null,
      },
      e1rmTrends,
      volumeByWeek: volumeData,
      compliance: complianceData,
      rpeDistribution: rpeData,
      rpeAccuracy,
      rpeHistory,
      bodyweightTrend: bodyweightData,
      vbt: vbtData,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get estimated 1RM trends over time.
 * Uses MaxSnapshot records (working max) grouped by exercise and date.
 * Falls back to RPE-based e1RM estimation from SetLogs when no MaxSnapshot exists.
 */
async function getE1RMTrends(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  exerciseId: string | null
) {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.date = dateRange;
  }
  if (exerciseId) {
    where.exerciseId = exerciseId;
  }

  const snapshots = await prisma.maxSnapshot.findMany({
    where,
    select: {
      date: true,
      workingMax: true,
      generatedMax: true,
      exerciseId: true,
      exercise: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by exercise
  const byExercise: Record<string, {
    exerciseId: string;
    exerciseName: string;
    dataPoints: { date: string; e1rm: number }[];
  }> = {};

  for (const snap of snapshots) {
    const eid = snap.exerciseId;
    if (!byExercise[eid]) {
      byExercise[eid] = {
        exerciseId: eid,
        exerciseName: snap.exercise.name,
        dataPoints: [],
      };
    }
    const e1rm = snap.generatedMax ?? snap.workingMax;
    byExercise[eid].dataPoints.push({
      date: formatPrismaDate(snap.date),
      e1rm,
    });
  }

  // If no MaxSnapshot data and no exerciseId filter, try RPE-based estimation
  // from the top sets in SetLogs (limited to avoid expensive queries)
  if (Object.keys(byExercise).length === 0) {
    const setWhere: Record<string, unknown> = { athleteId };
    if (dateRange.gte || dateRange.lte) {
      setWhere.completedAt = dateRange;
    }
    if (exerciseId) {
      setWhere.workoutExercise = { exerciseId };
    }

    const topSets = await prisma.setLog.findMany({
      where: {
        ...setWhere,
        rpe: { not: null },
        reps: { gte: 1 },
        weight: { gt: 0 },
      },
      select: {
        weight: true,
        reps: true,
        rpe: true,
        completedAt: true,
        workoutExercise: {
          select: {
            exerciseId: true,
            exercise: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
      take: 1000,
    });

    for (const set of topSets) {
      if (!set.rpe) continue;
      const estimated = estimateOneRMFromRPE(set.weight, set.rpe, set.reps);
      if (!estimated) continue;

      const eid = set.workoutExercise.exerciseId;
      if (!byExercise[eid]) {
        byExercise[eid] = {
          exerciseId: eid,
          exerciseName: set.workoutExercise.exercise.name,
          dataPoints: [],
        };
      }
      byExercise[eid].dataPoints.push({
        date: formatPrismaDate(set.completedAt),
        e1rm: Math.round(estimated * 10) / 10,
      });
    }
  }

  return Object.values(byExercise);
}

/**
 * Get weekly volume (tonnage = sets × reps × weight).
 * Groups SetLogs by ISO week.
 */
async function getVolumeByWeek(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }

  const setLogs = await prisma.setLog.findMany({
    where,
    select: {
      reps: true,
      weight: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'asc' },
  });

  // Group by ISO week
  const weekMap: Record<string, { weekStart: string; totalSets: number; totalReps: number; totalTonnage: number }> = {};

  for (const set of setLogs) {
    const weekStart = getISOWeekStart(set.completedAt);
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = { weekStart, totalSets: 0, totalReps: 0, totalTonnage: 0 };
    }
    weekMap[weekStart].totalSets += 1;
    weekMap[weekStart].totalReps += set.reps;
    weekMap[weekStart].totalTonnage += set.reps * set.weight;
  }

  return Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Get training compliance: assigned vs completed workouts.
 */
async function getCompliance(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  hasDateRange: string | null | false
) {
  const sessionWhere: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    sessionWhere.date = dateRange;
  }

  const sessions = await prisma.workoutSession.findMany({
    where: sessionWhere,
    select: {
      status: true,
      completionPercentage: true,
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  const total = sessions.length;
  const completed = sessions.filter(s => s.status === 'FULLY_COMPLETED').length;
  const partial = sessions.filter(s => s.status === 'PARTIALLY_COMPLETED').length;
  const notStarted = sessions.filter(s => s.status === 'NOT_STARTED').length;
  const avgCompletion = total > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.completionPercentage, 0) / total * 10) / 10
    : 0;

  // Weekly compliance trend
  const weekMap: Record<string, { weekStart: string; total: number; completed: number; rate: number }> = {};
  for (const session of sessions) {
    const weekStart = getISOWeekStart(session.date);
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = { weekStart, total: 0, completed: 0, rate: 0 };
    }
    weekMap[weekStart].total += 1;
    if (session.status === 'FULLY_COMPLETED' || session.status === 'PARTIALLY_COMPLETED') {
      weekMap[weekStart].completed += 1;
    }
  }
  for (const week of Object.values(weekMap)) {
    week.rate = week.total > 0 ? Math.round((week.completed / week.total) * 1000) / 10 : 0;
  }

  return {
    totalSessions: total,
    completed,
    partiallyCompleted: partial,
    notStarted,
    complianceRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    avgCompletionPercentage: avgCompletion,
    weeklyTrend: Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
  };
}

/**
 * Get RPE distribution and average RPE per week.
 * Optionally filtered by exercise.
 */
async function getRPEDistribution(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  rpeExerciseId: string | null
) {
  const where: Record<string, unknown> = {
    athleteId,
    rpe: { not: null },
  };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }
  if (rpeExerciseId) {
    where.workoutExercise = { exerciseId: rpeExerciseId };
  }

  const sets = await prisma.setLog.findMany({
    where,
    select: {
      rpe: true,
      completedAt: true,
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  });

  // Build list of exercises with RPE data (for the filter dropdown)
  const exerciseMap: Record<string, { id: string; name: string; count: number }> = {};
  for (const set of sets) {
    const eid = set.workoutExercise.exerciseId;
    if (!exerciseMap[eid]) {
      exerciseMap[eid] = { id: eid, name: set.workoutExercise.exercise.name, count: 0 };
    }
    exerciseMap[eid].count += 1;
  }

  // Overall distribution: count per RPE value
  const distribution: Record<number, number> = {};
  let totalRPE = 0;
  for (const set of sets) {
    if (set.rpe === null) continue;
    const rpeVal = set.rpe;
    distribution[rpeVal] = (distribution[rpeVal] ?? 0) + 1;
    totalRPE += rpeVal;
  }

  // Weekly average RPE
  const weekMap: Record<string, { weekStart: string; totalRPE: number; count: number; avgRPE: number }> = {};
  for (const set of sets) {
    if (set.rpe === null) continue;
    const weekStart = getISOWeekStart(set.completedAt);
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = { weekStart, totalRPE: 0, count: 0, avgRPE: 0 };
    }
    weekMap[weekStart].totalRPE += set.rpe;
    weekMap[weekStart].count += 1;
  }
  for (const week of Object.values(weekMap)) {
    week.avgRPE = Math.round((week.totalRPE / week.count) * 10) / 10;
  }

  return {
    totalSetsWithRPE: sets.length,
    averageRPE: sets.length > 0 ? Math.round((totalRPE / sets.length) * 10) / 10 : null,
    distribution: Object.entries(distribution)
      .map(([rpe, count]) => ({ rpe: parseFloat(rpe), count }))
      .sort((a, b) => a.rpe - b.rpe),
    weeklyTrend: Object.values(weekMap)
      .map(({ weekStart, avgRPE, count }) => ({ weekStart, avgRPE, setCount: count }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    exercises: Object.values(exerciseMap).sort((a, b) => b.count - a.count),
  };
}

/**
 * Get RPE accuracy: compare reported RPE to estimated RPE based on load/reps relative to known e1RM.
 * Requires MaxSnapshot data for the exercise.
 */
async function getRPEAccuracy(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  rpeExerciseId: string | null
) {
  // Get sets with RPE, weight, and reps
  const setWhere: Record<string, unknown> = {
    athleteId,
    rpe: { not: null },
    weight: { gt: 0 },
    reps: { gte: 1 },
  };
  if (dateRange.gte || dateRange.lte) {
    setWhere.completedAt = dateRange;
  }
  if (rpeExerciseId) {
    setWhere.workoutExercise = { exerciseId: rpeExerciseId };
  }

  const sets = await prisma.setLog.findMany({
    where: setWhere,
    select: {
      rpe: true,
      weight: true,
      reps: true,
      completedAt: true,
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
    take: 2000,
  });

  if (sets.length === 0) return null;

  // Get latest e1RM per exercise from MaxSnapshot
  const exerciseIds = [...new Set(sets.map(s => s.workoutExercise.exerciseId))];
  const latestMaxes = await prisma.maxSnapshot.findMany({
    where: {
      athleteId,
      exerciseId: { in: exerciseIds },
    },
    orderBy: { date: 'desc' },
    distinct: ['exerciseId'],
    select: {
      exerciseId: true,
      workingMax: true,
      generatedMax: true,
    },
  });

  const e1rmByExercise: Record<string, number> = {};
  for (const max of latestMaxes) {
    e1rmByExercise[max.exerciseId] = max.generatedMax ?? max.workingMax;
  }

  // Build inputs for the accuracy calculator
  const inputs: RPEAccuracyInput[] = [];
  for (const set of sets) {
    const eid = set.workoutExercise.exerciseId;
    const e1rm = e1rmByExercise[eid];
    if (!e1rm || set.rpe === null) continue;

    inputs.push({
      reportedRPE: set.rpe,
      weight: set.weight,
      reps: set.reps,
      e1RM: e1rm,
      date: formatPrismaDate(set.completedAt),
      exerciseId: eid,
      exerciseName: set.workoutExercise.exercise.name,
    });
  }

  return calculateRpeAccuracy(inputs);
}

/**
 * Get bodyweight trend data.
 */
async function getBodyweightTrend(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.loggedAt = dateRange;
  }

  const logs = await prisma.bodyweightLog.findMany({
    where,
    select: {
      weight: true,
      unit: true,
      loggedAt: true,
    },
    orderBy: { loggedAt: 'asc' },
  });

  return logs.map(log => ({
    date: formatPrismaDate(log.loggedAt),
    weight: log.weight,
    unit: log.unit,
  }));
}

/**
 * Get VBT (velocity-based training) data.
 * Returns all sets with velocity data, grouped by exercise, plus
 * the latest e1RM per exercise (for velocity profile bucketing).
 */
async function getVBTData(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {
    athleteId,
    velocity: { not: null },
  };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }

  const velocitySets = await prisma.setLog.findMany({
    where,
    select: {
      weight: true,
      velocity: true,
      reps: true,
      rpe: true,
      completedAt: true,
      setNumber: true,
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  });

  if (velocitySets.length === 0) {
    return { hasData: false, exercises: [], byExercise: {} };
  }

  // Group by exercise
  const byExercise: Record<string, {
    exerciseId: string;
    exerciseName: string;
    dataPoints: { weight: number; velocity: number; date: string; reps?: number; rpe?: number }[];
    sessions: Record<string, { weight: number; velocity: number; setNumber: number }[]>;
  }> = {};

  for (const set of velocitySets) {
    const eid = set.workoutExercise.exerciseId;
    if (!byExercise[eid]) {
      byExercise[eid] = {
        exerciseId: eid,
        exerciseName: set.workoutExercise.exercise.name,
        dataPoints: [],
        sessions: {},
      };
    }

    const date = formatPrismaDate(set.completedAt);

    byExercise[eid].dataPoints.push({
      weight: set.weight,
      velocity: set.velocity!,
      date,
      reps: set.reps,
      rpe: set.rpe ?? undefined,
    });

    // Group sets by session date for fatigue (velocity drop) calculation
    if (!byExercise[eid].sessions[date]) {
      byExercise[eid].sessions[date] = [];
    }
    byExercise[eid].sessions[date].push({
      weight: set.weight,
      velocity: set.velocity!,
      setNumber: set.setNumber,
    });
  }

  // Get latest e1RM per exercise for velocity profile bucketing
  const exerciseIds = Object.keys(byExercise);
  const latestMaxes = await prisma.maxSnapshot.findMany({
    where: {
      athleteId,
      exerciseId: { in: exerciseIds },
    },
    orderBy: { date: 'desc' },
    distinct: ['exerciseId'],
    select: {
      exerciseId: true,
      workingMax: true,
      generatedMax: true,
    },
  });

  const e1rmByExercise: Record<string, number> = {};
  for (const max of latestMaxes) {
    e1rmByExercise[max.exerciseId] = max.generatedMax ?? max.workingMax;
  }

  const exercises = Object.values(byExercise).map((ex) => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    dataPointCount: ex.dataPoints.length,
    sessionCount: Object.keys(ex.sessions).length,
  }));

  // Convert sessions to arrays sorted by set number for fatigue calculation
  const serialized: Record<string, {
    exerciseId: string;
    exerciseName: string;
    dataPoints: { weight: number; velocity: number; date: string; reps?: number; rpe?: number }[];
    sessionVelocities: { date: string; velocities: number[] }[];
    estimated1RM: number | null;
  }> = {};

  for (const [eid, ex] of Object.entries(byExercise)) {
    serialized[eid] = {
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      dataPoints: ex.dataPoints,
      sessionVelocities: Object.entries(ex.sessions)
        .map(([date, sets]) => ({
          date,
          velocities: sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => s.velocity),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      estimated1RM: e1rmByExercise[eid] ?? null,
    };
  }

  return {
    hasData: true,
    exercises,
    byExercise: serialized,
  };
}

/**
 * Get RPE history: individual set RPE data points over time for scatter + trend chart.
 * Returns per-set data ordered by date, plus a moving average trend line.
 */
async function getRPEHistory(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  rpeExerciseId: string | null
) {
  const where: Record<string, unknown> = {
    athleteId,
    rpe: { not: null },
  };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }
  if (rpeExerciseId) {
    where.workoutExercise = { exerciseId: rpeExerciseId };
  }

  const sets = await prisma.setLog.findMany({
    where,
    select: {
      rpe: true,
      weight: true,
      reps: true,
      completedAt: true,
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: 'asc' },
    take: 3000,
  });

  if (sets.length === 0) {
    return { hasData: false, dataPoints: [], trendLine: [] };
  }

  // Build individual data points
  const dataPoints = sets.map((set) => ({
    date: formatPrismaDate(set.completedAt),
    rpe: set.rpe!,
    weight: set.weight,
    reps: set.reps,
    exerciseName: set.workoutExercise.exercise.name,
  }));

  // Compute a 7-point simple moving average for the trend line
  const windowSize = Math.min(7, Math.max(3, Math.floor(dataPoints.length / 5)));
  const trendLine: { date: string; avgRPE: number }[] = [];
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(dataPoints.length, i + Math.ceil(windowSize / 2));
    const window = dataPoints.slice(start, end);
    const avg = window.reduce((sum, p) => sum + p.rpe, 0) / window.length;
    trendLine.push({
      date: dataPoints[i].date,
      avgRPE: Math.round(avg * 100) / 100,
    });
  }

  return { hasData: true, dataPoints, trendLine };
}

/**
 * Get the ISO week start (Monday) as YYYY-MM-DD string.
 */
function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return formatPrismaDate(d);
}
