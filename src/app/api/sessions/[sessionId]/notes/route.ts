import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const coachId = await getCurrentCoachId();

    const body = await request.json();
    const coachNotes = typeof body.coachNotes === 'string' ? body.coachNotes.trim() : null;

    // Verify session exists and belongs to an athlete of this coach
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        athlete: { coachId },
      },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: { coachNotes: coachNotes || null },
      select: { id: true, coachNotes: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update coach notes:', error);
    return NextResponse.json(
      { error: 'Failed to update coach notes' },
      { status: 500 }
    );
  }
}
