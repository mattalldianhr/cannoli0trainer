import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { estimateOneRMFromRPE } from '@/lib/rpe-table';

/**
 * GET /api/analytics/compare
 *
 * Returns overlayable analytics data for 2-3 athletes.
 * Used by the athlete comparison view to show trend lines on the same chart.
 *
 * Query params:
 * - athleteIds: comma-separated athlete IDs (2-3 required)
 * - from: ISO date string (start of range)
 * - to: ISO date string (end of range)
 * - metric: "e1rm" | "volume" | "compliance" (default: "e1rm")
 * - exerciseId: filter e1rm trends to a specific exercise (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const athleteIdsParam = searchParams.get('athleteIds');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const metric = searchParams.get('metric') ?? 'e1rm';
    const exerciseId = searchParams.get('exerciseId');

    if (!athleteIdsParam) {
      return NextResponse.json(
        { error: 'athleteIds query param is required (comma-separated)' },
        { status: 400 }
      );
    }

    const athleteIds = athleteIdsParam.split(',').filter(Boolean);
    if (athleteIds.length < 2 || athleteIds.length > 3) {
      return NextResponse.json(
        { error: 'Must provide 2 or 3 athlete IDs' },
        { status: 400 }
      );
    }

    const coachId = await getCurrentCoachId();

    // Validate athletes exist and belong to this coach
    const athletes = await prisma.athlete.findMany({
      where: { id: { in: athleteIds }, coachId },
      select: { id: true, name: true },
    });

    if (athletes.length !== athleteIds.length) {
      return NextResponse.json(
        { error: 'One or more athlete IDs not found' },
        { status: 404 }
      );
    }

    // Build date range filter
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (from) dateRange.gte = new Date(from);
    if (to) dateRange.lte = new Date(to);

    // Fetch data per athlete based on metric
    const athleteData = await Promise.all(
      athletes.map(async (athlete) => {
        switch (metric) {
          case 'e1rm':
            return {
              athleteId: athlete.id,
              athleteName: athlete.name,
              data: await getE1RMComparison(athlete.id, dateRange, exerciseId),
            };
          case 'volume':
            return {
              athleteId: athlete.id,
              athleteName: athlete.name,
              data: await getVolumeComparison(athlete.id, dateRange),
            };
          case 'compliance':
            return {
              athleteId: athlete.id,
              athleteName: athlete.name,
              data: await getComplianceComparison(athlete.id, dateRange),
            };
          default:
            return {
              athleteId: athlete.id,
              athleteName: athlete.name,
              data: await getE1RMComparison(athlete.id, dateRange, exerciseId),
            };
        }
      })
    );

    // For e1rm metric, collect the union of exercises across all athletes
    let exercises: { id: string; name: string }[] = [];
    if (metric === 'e1rm') {
      const exerciseMap = new Map<string, string>();
      for (const ad of athleteData) {
        const trends = ad.data as { exerciseId: string; exerciseName: string }[];
        for (const trend of trends) {
          exerciseMap.set(trend.exerciseId, trend.exerciseName);
        }
      }
      exercises = Array.from(exerciseMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      athletes: athletes.map((a) => ({ id: a.id, name: a.name })),
      metric,
      dateRange: { from: from ?? null, to: to ?? null },
      athleteData,
      exercises,
    });
  } catch (error) {
    console.error('Failed to fetch comparison data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}

async function getE1RMComparison(
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
      exercise: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });

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
    byExercise[eid].dataPoints.push({
      date: snap.date.toISOString().split('T')[0],
      e1rm: snap.generatedMax ?? snap.workingMax,
    });
  }

  // Fallback to RPE-based estimation if no snapshots
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
      take: 500,
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

async function getVolumeComparison(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    where.completedAt = dateRange;
  }

  const setLogs = await prisma.setLog.findMany({
    where,
    select: { reps: true, weight: true, completedAt: true },
    orderBy: { completedAt: 'asc' },
  });

  const weekMap: Record<string, { weekStart: string; totalTonnage: number }> = {};
  for (const set of setLogs) {
    const weekStart = getISOWeekStart(set.completedAt);
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = { weekStart, totalTonnage: 0 };
    }
    weekMap[weekStart].totalTonnage += set.reps * set.weight;
  }

  return Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

async function getComplianceComparison(
  athleteId: string,
  dateRange: { gte?: Date; lte?: Date }
) {
  const sessionWhere: Record<string, unknown> = { athleteId };
  if (dateRange.gte || dateRange.lte) {
    sessionWhere.date = dateRange;
  }

  const sessions = await prisma.workoutSession.findMany({
    where: sessionWhere,
    select: { status: true, date: true },
    orderBy: { date: 'asc' },
  });

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

  return Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}
