import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.coachId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, coachId' },
        { status: 400 }
      );
    }

    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    const program = await prisma.program.create({
      data: {
        coachId: body.coachId,
        name: body.name,
        description: body.description ?? null,
        type: body.type ?? 'individual',
        periodizationType: body.periodizationType ?? null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isTemplate: body.isTemplate ?? false,
        workouts: body.workouts
          ? {
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
            }
          : undefined,
      },
      include: {
        workouts: {
          include: { exercises: { include: { exercise: true } } },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Failed to create program:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const coachId = searchParams.get('coachId');
    const search = searchParams.get('search');
    const isTemplate = searchParams.get('isTemplate');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};

    if (coachId) {
      where.coachId = coachId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isTemplate !== null && isTemplate !== undefined) {
      where.isTemplate = isTemplate === 'true';
    }

    if (type) {
      where.type = type;
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        coach: { select: { id: true, name: true } },
        _count: {
          select: {
            workouts: true,
            assignments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
