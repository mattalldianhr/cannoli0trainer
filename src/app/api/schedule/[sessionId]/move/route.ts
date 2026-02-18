import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/schedule/[sessionId]/move
 * Move a workout session to a new date. If the target date already has a session
 * for the same athlete, the two sessions swap dates.
 *
 * Body: { newDate: string (YYYY-MM-DD) }
 * Only NOT_STARTED sessions can be moved.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { newDate } = body;

    if (!newDate || typeof newDate !== 'string') {
      return NextResponse.json(
        { error: 'newDate is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(newDate + 'T00:00:00Z');
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Fetch the session to move
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Only allow moving NOT_STARTED sessions
    if (session.status !== 'NOT_STARTED') {
      return NextResponse.json(
        { error: 'Only NOT_STARTED sessions can be moved' },
        { status: 400 }
      );
    }

    const currentDateStr = session.date.toISOString().split('T')[0];
    if (currentDateStr === newDate) {
      return NextResponse.json(
        { error: 'New date is the same as current date' },
        { status: 400 }
      );
    }

    // Check if there's an existing session on the target date for this athlete
    const existingSession = await prisma.workoutSession.findUnique({
      where: {
        athleteId_date: {
          athleteId: session.athleteId,
          date: parsedDate,
        },
      },
    });

    if (existingSession) {
      // Swap: exchange the dates of the two sessions
      // Both must be NOT_STARTED to swap
      if (existingSession.status !== 'NOT_STARTED') {
        return NextResponse.json(
          {
            error: 'Cannot swap — the session on the target date is not NOT_STARTED',
          },
          { status: 400 }
        );
      }

      // Use a transaction to swap dates atomically
      // Because of the unique constraint on [athleteId, date], we need to use a
      // temporary date for one session, then set both to their final values.
      await prisma.$transaction(async (tx) => {
        // Step 1: Move the target session to a temporary date far in the future
        const tempDate = new Date('2099-12-31T00:00:00Z');
        await tx.workoutSession.update({
          where: { id: existingSession.id },
          data: { date: tempDate },
        });

        // Step 2: Move the source session to the target date
        await tx.workoutSession.update({
          where: { id: session.id },
          data: {
            date: parsedDate,
            isManuallyScheduled: true,
          },
        });

        // Step 3: Move the previously-target session to the source's old date
        await tx.workoutSession.update({
          where: { id: existingSession.id },
          data: {
            date: session.date,
            isManuallyScheduled: true,
          },
        });
      });

      return NextResponse.json({
        action: 'swapped',
        movedSession: { id: session.id, newDate },
        swappedSession: { id: existingSession.id, newDate: currentDateStr },
      });
    } else {
      // Simple move: just update the date
      await prisma.workoutSession.update({
        where: { id: sessionId },
        data: {
          date: parsedDate,
          isManuallyScheduled: true,
        },
      });

      return NextResponse.json({
        action: 'moved',
        movedSession: { id: session.id, newDate },
      });
    }
  } catch (error) {
    console.error('Failed to move session:', error);
    return NextResponse.json(
      { error: 'Failed to move session' },
      { status: 500 }
    );
  }
}
