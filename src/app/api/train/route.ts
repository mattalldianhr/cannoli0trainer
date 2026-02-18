import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const athleteId = searchParams.get('athleteId');
    const dateParam = searchParams.get('date');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing required query param: athleteId' },
        { status: 400 }
      );
    }

    // Default to today (UTC date only, no time)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dateOnly = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    // Find the workout session for this athlete + date
    const session = await prisma.workoutSession.findUnique({
      where: {
        athleteId_date: {
          athleteId,
          date: dateOnly,
        },
      },
      include: {
        program: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      // Find the next upcoming NOT_STARTED session for this athlete
      const nextSession = await prisma.workoutSession.findFirst({
        where: {
          athleteId,
          date: { gt: dateOnly },
          status: 'NOT_STARTED',
          isSkipped: false,
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          title: true,
          program: { select: { name: true } },
        },
      });

      return NextResponse.json({
        session: null,
        exercises: [],
        message: 'No workout scheduled for this date',
        nextSession: nextSession
          ? {
              date: nextSession.date.toISOString(),
              title: nextSession.title,
              programName: nextSession.program?.name ?? null,
            }
          : null,
      });
    }

    // Find the Workout record that was created for this session date in this program.
    // WorkoutSession and Workout share the same programId + date association.
    // The Workout title matches the session title (or workout date).
    const workout = await prisma.workout.findFirst({
      where: {
        programId: session.programId!,
        name: session.title ?? undefined,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                equipment: true,
                primaryMuscles: true,
              },
            },
            setLogs: {
              where: { athleteId },
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workout) {
      return NextResponse.json({
        session: {
          id: session.id,
          date: session.date.toISOString(),
          title: session.title,
          status: session.status,
          completionPercentage: session.completionPercentage,
          completedItems: session.completedItems,
          totalItems: session.totalItems,
          program: session.program,
        },
        exercises: [],
        message: 'Session found but no workout exercises linked',
      });
    }

    // For each exercise, find the most recent previous session's sets
    const uniqueExerciseIds = [...new Set(workout.exercises.map((we) => we.exerciseId))];
    const prevByExercise = new Map<string, { reps: number; weight: number; unit: string; rpe: number | null; date: string }[]>();

    await Promise.all(
      uniqueExerciseIds.map(async (exerciseId) => {
        // Step 1: Find the most recent SetLog for this exercise (excluding current workout)
        const mostRecentSet = await prisma.setLog.findFirst({
          where: {
            athleteId,
            workoutExercise: {
              exerciseId,
              workout: { id: { not: workout.id } },
            },
          },
          select: { workoutExerciseId: true },
          orderBy: { completedAt: 'desc' },
        });

        if (!mostRecentSet) return;

        // Step 2: Get all sets from that same WorkoutExercise
        const prevSets = await prisma.setLog.findMany({
          where: {
            workoutExerciseId: mostRecentSet.workoutExerciseId,
            athleteId,
          },
          orderBy: { setNumber: 'asc' },
        });

        if (prevSets.length > 0) {
          // Use the first set's completedAt as the session date
          const sessionDate = prevSets[0].completedAt.toISOString().split('T')[0];
          prevByExercise.set(
            exerciseId,
            prevSets.map((sl) => ({
              reps: sl.reps,
              weight: sl.weight,
              unit: sl.unit,
              rpe: sl.rpe,
              date: sessionDate,
            })),
          );
        }
      }),
    );

    const exercises = workout.exercises.map((we) => ({
      id: we.id,
      order: we.order,
      prescriptionType: we.prescriptionType,
      prescribedSets: we.prescribedSets,
      prescribedReps: we.prescribedReps,
      prescribedLoad: we.prescribedLoad,
      prescribedRPE: we.prescribedRPE,
      prescribedRIR: we.prescribedRIR,
      velocityTarget: we.velocityTarget,
      percentageOf1RM: we.percentageOf1RM,
      supersetGroup: we.supersetGroup,
      supersetColor: we.supersetColor,
      isUnilateral: we.isUnilateral,
      restTimeSeconds: we.restTimeSeconds,
      tempo: we.tempo,
      notes: we.notes,
      athleteNotes: we.athleteNotes,
      exercise: we.exercise,
      setLogs: we.setLogs.map((sl) => ({
        id: sl.id,
        setNumber: sl.setNumber,
        reps: sl.reps,
        weight: sl.weight,
        unit: sl.unit,
        rpe: sl.rpe,
        rir: sl.rir,
        velocity: sl.velocity,
        completedAt: sl.completedAt.toISOString(),
        notes: sl.notes,
      })),
      previousPerformance: prevByExercise.get(we.exerciseId) ?? [],
    }));

    return NextResponse.json({
      session: {
        id: session.id,
        date: session.date.toISOString(),
        title: session.title,
        status: session.status,
        completionPercentage: session.completionPercentage,
        completedItems: session.completedItems,
        totalItems: session.totalItems,
        program: session.program,
      },
      exercises,
    });
  } catch (error) {
    console.error('Failed to fetch training data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}
