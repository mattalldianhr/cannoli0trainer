import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { estimateOneRMFromRPE } from '@/lib/rpe-table';

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

    // Validate athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
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
    ] = await Promise.all([
      getE1RMTrends(athleteId, dateRange, exerciseId),
      getVolumeByWeek(athleteId, dateRange),
      getCompliance(athleteId, dateRange, hasDateRange),
      getRPEDistribution(athleteId, dateRange),
      getBodyweightTrend(athleteId, dateRange),
    ]);

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
      bodyweightTrend: bodyweightData,
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
      date: snap.date.toISOString().split('T')[0],
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
        date: set.completedAt.toISOString().split('T')[0],
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
 */
async function getRPEDistribution(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {
    athleteId,
    rpe: { not: null },
  };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }

  const sets = await prisma.setLog.findMany({
    where,
    select: {
      rpe: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'asc' },
  });

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
  };
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
    date: log.loggedAt.toISOString().split('T')[0],
    weight: log.weight,
    unit: log.unit,
  }));
}

/**
 * Get the ISO week start (Monday) as YYYY-MM-DD string.
 */
function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  // ISO week starts on Monday (day 1). Sunday is 0, so shift it to 7.
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}
