import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { estimateOneRMFromRPE } from '@/lib/rpe-table';

/**
 * GET /api/athlete/progress?range=8w
 *
 * Returns aggregated progress data for the authenticated athlete:
 * - e1rmTrends: estimated 1RM over time per exercise (keyed by exerciseId)
 * - weeklyVolume: weekly tonnage array
 * - compliance: assigned/completed/streak
 * - personalRecords: all-time bests per exercise
 * - bodyweight: bodyweight entries over time (or null)
 * - availableExercises: exercises the athlete has data for
 *
 * Query params:
 * - range: "4w" | "8w" | "12w" | "all" (default: "8w")
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const athleteId = session?.user?.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '8w';

    // Parse range into a date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateRange = getRangeFilter(range, today);

    // Run all queries in parallel
    const [
      e1rmTrends,
      weeklyVolume,
      compliance,
      personalRecords,
      bodyweight,
      availableExercises,
    ] = await Promise.all([
      getE1RMTrends(athleteId, dateRange),
      getWeeklyVolume(athleteId, dateRange),
      getCompliance(athleteId, dateRange, today),
      getPersonalRecords(athleteId),
      getBodyweight(athleteId, dateRange),
      getAvailableExercises(athleteId),
    ]);

    return NextResponse.json({
      e1rmTrends,
      weeklyVolume,
      compliance,
      personalRecords,
      bodyweight,
      availableExercises,
    });
  } catch (error) {
    console.error('Failed to fetch athlete progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

/**
 * Parse a range string into a date filter object.
 */
function getRangeFilter(
  range: string,
  today: Date
): { gte?: Date; lte?: Date } {
  const lte = today;
  switch (range) {
    case '4w': {
      const gte = new Date(today);
      gte.setDate(gte.getDate() - 28);
      return { gte, lte };
    }
    case '8w': {
      const gte = new Date(today);
      gte.setDate(gte.getDate() - 56);
      return { gte, lte };
    }
    case '12w': {
      const gte = new Date(today);
      gte.setDate(gte.getDate() - 84);
      return { gte, lte };
    }
    case 'all':
      return {};
    default: {
      // Default to 8 weeks
      const gte = new Date(today);
      gte.setDate(gte.getDate() - 56);
      return { gte, lte };
    }
  }
}

/**
 * Get estimated 1RM trends over time, keyed by exerciseId.
 * Uses MaxSnapshot records first, falls back to RPE-based estimation from SetLogs.
 */
async function getE1RMTrends(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
): Promise<Record<string, { date: string; value: number }[]>> {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.date = dateRange;
  }

  const snapshots = await prisma.maxSnapshot.findMany({
    where,
    select: {
      date: true,
      workingMax: true,
      generatedMax: true,
      exerciseId: true,
    },
    orderBy: { date: 'asc' },
  });

  const byExercise: Record<string, { date: string; value: number }[]> = {};

  for (const snap of snapshots) {
    const eid = snap.exerciseId;
    if (!byExercise[eid]) {
      byExercise[eid] = [];
    }
    const e1rm = snap.generatedMax ?? snap.workingMax;
    byExercise[eid].push({
      date: snap.date.toISOString().split('T')[0],
      value: Math.round(e1rm * 10) / 10,
    });
  }

  // If no MaxSnapshot data, try RPE-based estimation from SetLogs
  if (Object.keys(byExercise).length === 0) {
    const setWhere: Record<string, unknown> = { athleteId };
    if (dateRange.gte || dateRange.lte) {
      setWhere.completedAt = dateRange;
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
          select: { exerciseId: true },
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
        byExercise[eid] = [];
      }
      byExercise[eid].push({
        date: set.completedAt.toISOString().split('T')[0],
        value: Math.round(estimated * 10) / 10,
      });
    }
  }

  return byExercise;
}

/**
 * Get weekly volume (tonnage = reps x weight per set, summed by week).
 */
async function getWeeklyVolume(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
): Promise<{ weekStart: string; tonnage: number }[]> {
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

  const weekMap: Record<string, number> = {};

  for (const set of setLogs) {
    const weekStart = getISOWeekStart(set.completedAt);
    weekMap[weekStart] = (weekMap[weekStart] ?? 0) + set.reps * set.weight;
  }

  return Object.entries(weekMap)
    .map(([weekStart, tonnage]) => ({ weekStart, tonnage: Math.round(tonnage) }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Get training compliance: assigned vs completed workouts + streak.
 */
async function getCompliance(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date },
  today: Date
): Promise<{ assigned: number; completed: number; streak: number }> {
  const sessionWhere: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    sessionWhere.date = dateRange;
  }

  const sessions = await prisma.workoutSession.findMany({
    where: sessionWhere,
    select: {
      status: true,
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  const assigned = sessions.length;
  const completed = sessions.filter(
    (s) => s.status === 'FULLY_COMPLETED' || s.status === 'PARTIALLY_COMPLETED'
  ).length;

  // Calculate streak: consecutive training days going backwards from today
  const streakSessions = await prisma.workoutSession.findMany({
    where: {
      athleteId,
      date: {
        gte: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
        lte: today,
      },
      isSkipped: false,
      status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
    },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  let streak = 0;
  if (streakSessions.length > 0) {
    const sessionDates = new Set(
      streakSessions.map((s) => s.date.toISOString().split('T')[0])
    );
    const checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sessionDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { assigned, completed, streak };
}

/**
 * Get all-time personal records (best MaxSnapshot per exercise).
 * Returns records sorted most recent first, with isRecent flag for last 7 days.
 */
async function getPersonalRecords(
  athleteId: string
): Promise<
  {
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
    isRecent: boolean;
    category: string;
    tags: string[];
  }[]
> {
  // Get the best (highest workingMax) MaxSnapshot per exercise
  const allSnapshots = await prisma.maxSnapshot.findMany({
    where: { athleteId },
    select: {
      exerciseId: true,
      workingMax: true,
      generatedMax: true,
      date: true,
      exercise: { select: { name: true, category: true, tags: true } },
    },
    orderBy: { workingMax: 'desc' },
  });

  // Keep only the best per exercise
  const bestByExercise: Record<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      weight: number;
      date: Date;
      category: string;
      tags: string[];
    }
  > = {};

  for (const snap of allSnapshots) {
    const eid = snap.exerciseId;
    const weight = snap.generatedMax ?? snap.workingMax;
    if (!bestByExercise[eid] || weight > bestByExercise[eid].weight) {
      bestByExercise[eid] = {
        exerciseId: eid,
        exerciseName: snap.exercise.name,
        weight,
        date: snap.date,
        category: snap.exercise.category,
        tags: Array.isArray(snap.exercise.tags) ? (snap.exercise.tags as string[]) : [],
      };
    }
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return Object.values(bestByExercise)
    .map((pr) => ({
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      weight: pr.weight,
      reps: 1, // MaxSnapshot represents a 1RM
      date: pr.date.toISOString().split('T')[0],
      isRecent: pr.date >= sevenDaysAgo,
      category: pr.category,
      tags: pr.tags,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get bodyweight trend data. Returns null if fewer than 2 entries.
 */
async function getBodyweight(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
): Promise<{ date: string; weight: number }[] | null> {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.loggedAt = dateRange;
  }

  const logs = await prisma.bodyweightLog.findMany({
    where,
    select: {
      weight: true,
      loggedAt: true,
    },
    orderBy: { loggedAt: 'asc' },
  });

  if (logs.length < 2) return null;

  return logs.map((log) => ({
    date: log.loggedAt.toISOString().split('T')[0],
    weight: log.weight,
  }));
}

/**
 * Get the list of exercises the athlete has data for (from MaxSnapshots and SetLogs).
 */
async function getAvailableExercises(
  athleteId: string
): Promise<{ id: string; name: string }[]> {
  // Get exercises from MaxSnapshots
  const snapshotExercises = await prisma.maxSnapshot.findMany({
    where: { athleteId },
    select: {
      exerciseId: true,
      exercise: { select: { id: true, name: true } },
    },
    distinct: ['exerciseId'],
  });

  // Get exercises from SetLogs
  const setLogExercises = await prisma.setLog.findMany({
    where: { athleteId },
    select: {
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { id: true, name: true } },
        },
      },
    },
    distinct: ['workoutExerciseId'],
    take: 200,
  });

  // Merge and deduplicate
  const exerciseMap: Record<string, string> = {};
  for (const snap of snapshotExercises) {
    exerciseMap[snap.exercise.id] = snap.exercise.name;
  }
  for (const set of setLogExercises) {
    const eid = set.workoutExercise.exerciseId;
    if (!exerciseMap[eid]) {
      exerciseMap[eid] = set.workoutExercise.exercise.name;
    }
  }

  return Object.entries(exerciseMap)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get the ISO week start (Monday) as YYYY-MM-DD string.
 */
function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}
