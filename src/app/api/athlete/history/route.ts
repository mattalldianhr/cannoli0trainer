import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const sessionId = searchParams.get('sessionId');

    // If sessionId is provided, return detail for that session
    if (sessionId) {
      const workoutSession = await prisma.workoutSession.findFirst({
        where: { id: sessionId, athleteId },
        include: {
          program: { select: { name: true } },
          workout: {
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: {
                  exercise: { select: { name: true, category: true } },
                  setLogs: {
                    where: { athleteId },
                    orderBy: { setNumber: 'asc' },
                    select: {
                      id: true,
                      setNumber: true,
                      reps: true,
                      weight: true,
                      unit: true,
                      rpe: true,
                      velocity: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!workoutSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      const exercises = (workoutSession.workout?.exercises ?? []).map((we) => ({
        id: we.id,
        name: we.exercise.name,
        category: we.exercise.category,
        sets: we.setLogs.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rpe: s.rpe,
          velocity: s.velocity,
        })),
        totalVolume: we.setLogs.reduce((sum, s) => sum + s.weight * s.reps, 0),
      }));

      return NextResponse.json({
        session: {
          id: workoutSession.id,
          date: workoutSession.date.toISOString(),
          title: workoutSession.title,
          status: workoutSession.status,
          completionPercentage: workoutSession.completionPercentage,
          completedItems: workoutSession.completedItems,
          totalItems: workoutSession.totalItems,
          programName: workoutSession.program?.name ?? null,
          weekNumber: workoutSession.weekNumber,
          dayNumber: workoutSession.dayNumber,
          exercises,
        },
      });
    }

    // Paginated list of sessions
    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: {
          athleteId,
          status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          program: { select: { name: true } },
          workout: {
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: {
                  exercise: { select: { name: true } },
                  setLogs: {
                    where: { athleteId },
                    select: {
                      reps: true,
                      weight: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.workoutSession.count({
        where: {
          athleteId,
          status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
        },
      }),
    ]);

    const data = sessions.map((s) => {
      const exerciseNames = (s.workout?.exercises ?? []).map(
        (we) => we.exercise.name
      );
      const totalVolume = (s.workout?.exercises ?? []).reduce(
        (sum, we) =>
          sum +
          we.setLogs.reduce((setSum, sl) => setSum + sl.weight * sl.reps, 0),
        0
      );
      const totalSets = (s.workout?.exercises ?? []).reduce(
        (sum, we) => sum + we.setLogs.length,
        0
      );

      return {
        id: s.id,
        date: s.date.toISOString(),
        title: s.title,
        status: s.status,
        completionPercentage: s.completionPercentage,
        completedItems: s.completedItems,
        totalItems: s.totalItems,
        programName: s.program?.name ?? null,
        weekNumber: s.weekNumber,
        dayNumber: s.dayNumber,
        exerciseNames: exerciseNames.slice(0, 5),
        exerciseCount: exerciseNames.length,
        totalVolume: Math.round(totalVolume),
        totalSets,
      };
    });

    return NextResponse.json({
      data,
      total,
      hasMore: skip + limit < total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch athlete history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
