import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/athlete/messages/read — Mark all messages in conversation as read (athlete side).
 * Resets athlete's unread count and sets readAt on all coach-sent messages.
 */
export async function PATCH() {
  try {
    const session = await auth();
    const athleteId = session?.user?.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: { athleteId },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          senderType: 'COACH',
          readAt: null,
        },
        data: { readAt: now },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCountAthlete: 0 },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark athlete messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
