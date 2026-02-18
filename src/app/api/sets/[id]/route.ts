import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const setLog = await prisma.setLog.findUnique({
      where: { id },
      include: {
        workoutExercise: {
          include: { exercise: true },
        },
        athlete: true,
      },
    });

    if (!setLog) {
      return NextResponse.json(
        { error: 'Set log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(setLog);
  } catch (error) {
    console.error('Failed to fetch set log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch set log' },
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

    const existing = await prisma.setLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Set log not found' },
        { status: 404 }
      );
    }

    const setLog = await prisma.setLog.update({
      where: { id },
      data: {
        ...(body.reps != null && { reps: body.reps }),
        ...(body.weight != null && { weight: body.weight }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.rpe !== undefined && { rpe: body.rpe }),
        ...(body.rir !== undefined && { rir: body.rir }),
        ...(body.velocity !== undefined && { velocity: body.velocity }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: {
        workoutExercise: {
          include: { exercise: true },
        },
      },
    });

    return NextResponse.json(setLog);
  } catch (error) {
    console.error('Failed to update set log:', error);
    return NextResponse.json(
      { error: 'Failed to update set log' },
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

    const existing = await prisma.setLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Set log not found' },
        { status: 404 }
      );
    }

    await prisma.setLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete set log:', error);
    return NextResponse.json(
      { error: 'Failed to delete set log' },
      { status: 500 }
    );
  }
}
