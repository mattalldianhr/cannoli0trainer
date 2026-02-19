import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

/**
 * PATCH /api/messages/[athleteId]/read — Mark all messages in conversation as read (coach side).
 * Resets coach's unread count and sets readAt on all athlete-sent messages.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  try {
    const coachId = await getCurrentCoachId();
    const { athleteId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: {
        coachId_athleteId: { coachId, athleteId },
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Mark all unread athlete messages as read and reset coach unread count
    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          senderType: 'ATHLETE',
          readAt: null,
        },
        data: { readAt: now },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCountCoach: 0 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
