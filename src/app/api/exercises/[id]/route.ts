import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            workoutExercises: true,
            maxSnapshots: true,
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
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

    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.force !== undefined && { force: body.force }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.mechanic !== undefined && { mechanic: body.mechanic }),
        ...(body.equipment !== undefined && { equipment: body.equipment }),
        ...(body.primaryMuscles !== undefined && { primaryMuscles: body.primaryMuscles }),
        ...(body.secondaryMuscles !== undefined && { secondaryMuscles: body.secondaryMuscles }),
        ...(body.instructions !== undefined && { instructions: body.instructions }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.cues !== undefined && { cues: body.cues }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    });

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to update exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
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

    const existing = await prisma.exercise.findUnique({
      where: { id },
      include: {
        _count: {
          select: { workoutExercises: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    if (existing._count.workoutExercises > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete exercise that is used in workouts',
          usageCount: existing._count.workoutExercises,
        },
        { status: 409 }
      );
    }

    await prisma.exercise.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
