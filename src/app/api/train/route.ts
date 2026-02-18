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
      return NextResponse.json({
        session: null,
        exercises: [],
        message: 'No workout scheduled for this date',
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

    // For each exercise, fetch the last performance (most recent SetLog for the same exercise)
    const exerciseIds = workout.exercises.map((we) => we.exerciseId);
    const previousPerformance = await prisma.setLog.findMany({
      where: {
        athleteId,
        workoutExercise: {
          exerciseId: { in: exerciseIds },
          workout: {
            // Exclude current workout
            id: { not: workout.id },
          },
        },
      },
      include: {
        workoutExercise: {
          select: { exerciseId: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Group previous performance by exerciseId — take the most recent session's sets
    const prevByExercise = new Map<string, { reps: number; weight: number; unit: string; rpe: number | null }[]>();
    for (const log of previousPerformance) {
      const exId = log.workoutExercise.exerciseId;
      if (!prevByExercise.has(exId)) {
        prevByExercise.set(exId, []);
      }
      const existing = prevByExercise.get(exId)!;
      // Only keep the first batch (most recent date) — stop if we already have sets and this is a different date
      if (existing.length > 0) continue;
      existing.push({
        reps: log.reps,
        weight: log.weight,
        unit: log.unit,
        rpe: log.rpe,
      });
    }

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
