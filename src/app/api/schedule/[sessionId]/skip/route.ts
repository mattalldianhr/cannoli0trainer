import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/schedule/[sessionId]/skip
 * Toggle the skip status of a workout session.
 * Only NOT_STARTED sessions can be skipped or unskipped.
 *
 * Body: { skip: boolean }
 *   skip=true  -> mark as skipped (isSkipped=true)
 *   skip=false -> unskip (isSkipped=false)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { skip } = body;

    if (typeof skip !== 'boolean') {
      return NextResponse.json(
        { error: 'skip is required (boolean)' },
        { status: 400 }
      );
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'NOT_STARTED') {
      return NextResponse.json(
        { error: 'Only NOT_STARTED sessions can be skipped' },
        { status: 400 }
      );
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: { isSkipped: skip },
    });

    return NextResponse.json({
      id: updated.id,
      isSkipped: updated.isSkipped,
    });
  } catch (error) {
    console.error('Failed to update skip status:', error);
    return NextResponse.json(
      { error: 'Failed to update skip status' },
      { status: 500 }
    );
  }
}
