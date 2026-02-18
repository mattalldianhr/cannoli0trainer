import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const source = await prisma.program.findUnique({
      where: { id },
      include: {
        workouts: {
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const templateName = body.name || `${source.name} (Template)`;
    const templateDescription = body.description ?? source.description;

    const template = await prisma.program.create({
      data: {
        coachId: source.coachId,
        name: templateName,
        description: templateDescription,
        type: 'template',
        periodizationType: source.periodizationType,
        isTemplate: true,
        workouts: {
          create: source.workouts.map((w) => ({
            name: w.name,
            dayNumber: w.dayNumber,
            weekNumber: w.weekNumber,
            notes: w.notes,
            exercises: {
              create: w.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                order: e.order,
                prescriptionType: e.prescriptionType,
                prescribedSets: e.prescribedSets,
                prescribedReps: e.prescribedReps,
                prescribedRPE: e.prescribedRPE,
                prescribedRIR: e.prescribedRIR,
                velocityTarget: e.velocityTarget,
                percentageOf1RM: e.percentageOf1RM,
                supersetGroup: e.supersetGroup,
                supersetColor: e.supersetColor,
                isUnilateral: e.isUnilateral,
                restTimeSeconds: e.restTimeSeconds,
                tempo: e.tempo,
                notes: e.notes,
                // Intentionally omit prescribedLoad — templates don't carry athlete-specific loads
                prescribedLoad: null,
              })),
            },
          })),
        },
      },
      include: {
        workouts: {
          include: { exercises: { include: { exercise: true } } },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
