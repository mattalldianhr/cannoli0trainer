import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSessionStatus } from '@/lib/training/update-session-status';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.workoutExerciseId || !body.athleteId || body.setNumber == null || body.reps == null || body.weight == null) {
      return NextResponse.json(
        { error: 'Missing required fields: workoutExerciseId, athleteId, setNumber, reps, weight' },
        { status: 400 }
      );
    }

    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: body.workoutExerciseId },
    });

    if (!workoutExercise) {
      return NextResponse.json(
        { error: 'WorkoutExercise not found' },
        { status: 404 }
      );
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: body.athleteId },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    const setLog = await prisma.setLog.create({
      data: {
        workoutExerciseId: body.workoutExerciseId,
        athleteId: body.athleteId,
        setNumber: body.setNumber,
        reps: body.reps,
        weight: body.weight,
        unit: body.unit ?? 'lbs',
        rpe: body.rpe ?? null,
        rir: body.rir ?? null,
        velocity: body.velocity ?? null,
        notes: body.notes ?? null,
      },
      include: {
        workoutExercise: {
          include: { exercise: true },
        },
      },
    });

    // Update session completion status
    await updateSessionStatus(body.workoutExerciseId, body.athleteId);

    return NextResponse.json(setLog, { status: 201 });
  } catch (error) {
    console.error('Failed to create set log:', error);
    return NextResponse.json(
      { error: 'Failed to create set log' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const athleteId = searchParams.get('athleteId');
    const exerciseId = searchParams.get('exerciseId');
    const workoutExerciseId = searchParams.get('workoutExerciseId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing required query param: athleteId' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { athleteId };

    if (workoutExerciseId) {
      where.workoutExerciseId = workoutExerciseId;
    }

    if (exerciseId) {
      where.workoutExercise = { exerciseId };
    }

    const setLogs = await prisma.setLog.findMany({
      where,
      include: {
        workoutExercise: {
          include: { exercise: true },
        },
      },
      orderBy: [{ completedAt: 'desc' }, { setNumber: 'asc' }],
      ...(limit ? { take: parseInt(limit, 10) } : {}),
      ...(offset ? { skip: parseInt(offset, 10) } : {}),
    });

    return NextResponse.json(setLogs);
  } catch (error) {
    console.error('Failed to fetch set logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch set logs' },
      { status: 500 }
    );
  }
}
