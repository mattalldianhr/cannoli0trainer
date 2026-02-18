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
    const athlete = await prisma.athlete.findUnique({
      where: { id, coachId },
      include: {
        coach: {
          select: { id: true, name: true, brandName: true },
        },
        programAssignments: {
          include: {
            program: {
              select: { id: true, name: true, type: true, startDate: true, endDate: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        workoutSessions: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            date: true,
            status: true,
            completionPercentage: true,
            completedItems: true,
            totalItems: true,
          },
        },
        _count: {
          select: {
            setLogs: true,
            workoutSessions: true,
            programAssignments: true,
            bodyweightLogs: true,
            meetEntries: true,
            maxSnapshots: true,
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Failed to fetch athlete:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete' },
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

    const existing = await prisma.athlete.findUnique({ where: { id, coachId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    const athlete = await prisma.athlete.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.bodyweight !== undefined && { bodyweight: body.bodyweight }),
        ...(body.weightClass !== undefined && { weightClass: body.weightClass }),
        ...(body.experienceLevel !== undefined && { experienceLevel: body.experienceLevel }),
        ...(body.isRemote !== undefined && { isRemote: body.isRemote }),
        ...(body.isCompetitor !== undefined && { isCompetitor: body.isCompetitor }),
        ...(body.federation !== undefined && { federation: body.federation }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      },
    });

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Failed to update athlete:', error);
    return NextResponse.json(
      { error: 'Failed to update athlete' },
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

    const existing = await prisma.athlete.findUnique({ where: { id, coachId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    await prisma.athlete.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete athlete:', error);
    return NextResponse.json(
      { error: 'Failed to delete athlete' },
      { status: 500 }
    );
  }
}
