import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAthleteCoachTimezone } from '@/lib/coach';
import { todayDateInTimezone, parseDateForPrisma, formatPrismaDate } from '@/lib/date-utils';

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
    const dateParam = searchParams.get('date');

    // Get coach timezone via athlete's coachId
    const tz = await getAthleteCoachTimezone(athleteId);

    // Get coach defaults via athlete's coach relation
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        coach: {
          select: { defaultWeightUnit: true, defaultRestTimerSeconds: true },
        },
      },
    });
    const defaultWeightUnit = athlete?.coach?.defaultWeightUnit ?? 'lbs';
    const defaultRestTimerSeconds = athlete?.coach?.defaultRestTimerSeconds ?? 120;

    // Parse date param as UTC midnight for Prisma, default to today in coach timezone
    let dateOnly: Date;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dateOnly = parseDateForPrisma(dateParam);
    } else {
      dateOnly = todayDateInTimezone(tz);
    }

    // Debug: log what we're querying
    console.log('[athlete/train] athleteId:', athleteId, 'dateParam:', dateParam, 'tz:', tz, 'dateOnly:', dateOnly.toISOString());

    // Find the workout session for this athlete + date
    const workoutSession = await prisma.workoutSession.findUnique({
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

    // Debug: log nearby sessions to understand what's in the DB
    if (!workoutSession) {
      const nearby = await prisma.workoutSession.findMany({
        where: {
          athleteId,
          date: {
            gte: new Date(dateOnly.getTime() - 2 * 24 * 60 * 60 * 1000),
            lte: new Date(dateOnly.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        },
        select: { date: true, title: true },
        orderBy: { date: 'asc' },
      });
      console.log('[athlete/train] NO session found. Nearby sessions:', nearby.map(s => ({ date: s.date.toISOString(), title: s.title })));
    } else {
      console.log('[athlete/train] Found session:', workoutSession.title, workoutSession.date.toISOString());
    }

    if (!workoutSession) {
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
        defaultWeightUnit,
        defaultRestTimerSeconds,
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

    const workout = await prisma.workout.findFirst({
      where: {
        programId: workoutSession.programId!,
        name: workoutSession.title ?? undefined,
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
          id: workoutSession.id,
          date: workoutSession.date.toISOString(),
          title: workoutSession.title,
          status: workoutSession.status,
          completionPercentage: workoutSession.completionPercentage,
          completedItems: workoutSession.completedItems,
          totalItems: workoutSession.totalItems,
          program: workoutSession.program,
        },
        exercises: [],
        defaultWeightUnit,
        defaultRestTimerSeconds,
        message: 'Session found but no workout exercises linked',
      });
    }

    // For each exercise, find the most recent previous session's sets
    const uniqueExerciseIds = [...new Set(workout.exercises.map((we) => we.exerciseId))];
    const prevByExercise = new Map<string, { reps: number; weight: number; unit: string; rpe: number | null; date: string }[]>();

    await Promise.all(
      uniqueExerciseIds.map(async (exerciseId) => {
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

        const prevSets = await prisma.setLog.findMany({
          where: {
            workoutExerciseId: mostRecentSet.workoutExerciseId,
            athleteId,
          },
          orderBy: { setNumber: 'asc' },
        });

        if (prevSets.length > 0) {
          const sessionDate = formatPrismaDate(prevSets[0].completedAt);
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
        id: workoutSession.id,
        date: workoutSession.date.toISOString(),
        title: workoutSession.title,
        status: workoutSession.status,
        completionPercentage: workoutSession.completionPercentage,
        completedItems: workoutSession.completedItems,
        totalItems: workoutSession.totalItems,
        program: workoutSession.program,
      },
      exercises,
      defaultWeightUnit,
      defaultRestTimerSeconds,
    });
  } catch (error) {
    console.error('Failed to fetch athlete training data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}
