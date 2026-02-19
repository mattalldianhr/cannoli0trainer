import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: athleteId } = await params;
    const coachId = await getCurrentCoachId();

    // Verify athlete belongs to this coach
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId, coachId },
      select: { id: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const sessionId = searchParams.get('sessionId');

    // Detail view for a single session
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
                      rir: true,
                      velocity: true,
                      notes: true,
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
        supersetGroup: we.supersetGroup,
        supersetColor: we.supersetColor,
        notes: we.notes,
        athleteNotes: we.athleteNotes,
        prescribed: {
          sets: we.prescribedSets,
          reps: we.prescribedReps,
          load: we.prescribedLoad,
          rpe: we.prescribedRPE,
          rir: we.prescribedRIR,
          velocityTarget: we.velocityTarget,
          percentageOf1RM: we.percentageOf1RM,
          prescriptionType: we.prescriptionType,
        },
        sets: we.setLogs.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          rpe: s.rpe,
          rir: s.rir,
          velocity: s.velocity,
          notes: s.notes,
        })),
        totalVolume: we.setLogs.reduce((sum, s) => sum + s.weight * s.reps, 0),
      }));

      const totalPrescribedVolume = exercises.reduce((sum, ex) => {
        const prescribedSets = parseInt(ex.prescribed.sets || '0', 10) || 0;
        const prescribedReps = parseInt(ex.prescribed.reps || '0', 10) || 0;
        const prescribedLoad = parseFloat(ex.prescribed.load || '0') || 0;
        return sum + prescribedSets * prescribedReps * prescribedLoad;
      }, 0);

      const totalActualVolume = exercises.reduce((sum, ex) => sum + ex.totalVolume, 0);

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
          durationSeconds: workoutSession.durationSeconds,
          coachNotes: workoutSession.coachNotes,
          exercises,
          totalPrescribedVolume: Math.round(totalPrescribedVolume),
          totalActualVolume: Math.round(totalActualVolume),
        },
      });
    }

    // Paginated list of sessions
    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { athleteId },
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
        where: { athleteId },
      }),
    ]);

    const data = sessions.map((s) => {
      const exercises = s.workout?.exercises ?? [];
      const totalVolume = exercises.reduce(
        (sum, we) =>
          sum + we.setLogs.reduce((setSum, sl) => setSum + sl.weight * sl.reps, 0),
        0
      );
      const totalSets = exercises.reduce(
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
        durationSeconds: s.durationSeconds,
        exerciseCount: exercises.length,
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
