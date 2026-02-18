import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const program = await prisma.program.findUnique({
      where: { id },
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
    const body = await request.json();

    const existing = await prisma.program.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Update program fields
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

    const existing = await prisma.program.findUnique({ where: { id } });
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
