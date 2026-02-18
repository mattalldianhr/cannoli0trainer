import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { athleteNotes } = body;

    if (typeof athleteNotes !== 'string' && athleteNotes !== null) {
      return NextResponse.json(
        { error: 'athleteNotes must be a string or null' },
        { status: 400 }
      );
    }

    const updated = await prisma.workoutExercise.update({
      where: { id },
      data: { athleteNotes: athleteNotes || null },
      select: { id: true, athleteNotes: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update exercise notes:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise notes' },
      { status: 500 }
    );
  }
}
