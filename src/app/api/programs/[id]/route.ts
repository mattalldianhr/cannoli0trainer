import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coachId = await getCurrentCoachId();
    const program = await prisma.program.findUnique({
      where: { id, coachId },
      include: {
        coach: { select: { id: true, name: true, brandName: true } },
        workouts: {
          include: {
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    equipment: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
        assignments: {
          include: {
            athlete: {
              select: { id: true, name: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        _count: {
          select: {
            workouts: true,
            assignments: true,
            workoutSessions: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Failed to fetch program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    const existing = await prisma.program.findUnique({ where: { id, coachId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // If workouts are provided, do a full replace inside a transaction
    if (body.workouts) {
      const program = await prisma.$transaction(async (tx) => {
        // Delete all existing workouts (cascades to WorkoutExercise)
        await tx.workout.deleteMany({ where: { programId: id } });

        // Update program fields + create new workouts
        return tx.program.update({
          where: { id },
          data: {
            ...(body.name !== undefined && { name: body.name }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.type !== undefined && { type: body.type }),
            ...(body.periodizationType !== undefined && { periodizationType: body.periodizationType }),
            ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
            ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
            ...(body.isTemplate !== undefined && { isTemplate: body.isTemplate }),
            workouts: {
              create: body.workouts.map(
                (w: {
                  name: string;
                  dayNumber: number;
                  weekNumber: number;
                  notes?: string;
                  exercises?: {
                    exerciseId: string;
                    order: number;
                    prescriptionType?: string;
                    prescribedSets?: string;
                    prescribedReps?: string;
                    prescribedLoad?: string;
                    prescribedRPE?: number;
                    prescribedRIR?: number;
                    velocityTarget?: number;
                    percentageOf1RM?: number;
                    supersetGroup?: string;
                    supersetColor?: string;
                    isUnilateral?: boolean;
                    restTimeSeconds?: number;
                    tempo?: string;
                    notes?: string;
                  }[];
                }) => ({
                  name: w.name,
                  dayNumber: w.dayNumber,
                  weekNumber: w.weekNumber,
                  notes: w.notes ?? null,
                  exercises: w.exercises
                    ? {
                        create: w.exercises.map((e) => ({
                          exerciseId: e.exerciseId,
                          order: e.order,
                          prescriptionType: e.prescriptionType ?? 'fixed',
                          prescribedSets: e.prescribedSets ?? null,
                          prescribedReps: e.prescribedReps ?? null,
                          prescribedLoad: e.prescribedLoad ?? null,
                          prescribedRPE: e.prescribedRPE ?? null,
                          prescribedRIR: e.prescribedRIR ?? null,
                          velocityTarget: e.velocityTarget ?? null,
                          percentageOf1RM: e.percentageOf1RM ?? null,
                          supersetGroup: e.supersetGroup ?? null,
                          supersetColor: e.supersetColor ?? null,
                          isUnilateral: e.isUnilateral ?? false,
                          restTimeSeconds: e.restTimeSeconds ?? null,
                          tempo: e.tempo ?? null,
                          notes: e.notes ?? null,
                        })),
                      }
                    : undefined,
                })
              ),
            },
          },
          include: {
            workouts: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
            },
            _count: { select: { assignments: true } },
          },
        });
      });

      return NextResponse.json(program);
    }

    // Partial update — program fields only (no workouts)
    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.periodizationType !== undefined && { periodizationType: body.periodizationType }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.isTemplate !== undefined && { isTemplate: body.isTemplate }),
      },
      include: {
        workouts: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Failed to update program:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coachId = await getCurrentCoachId();

    const existing = await prisma.program.findUnique({ where: { id, coachId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete program:', error);
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
