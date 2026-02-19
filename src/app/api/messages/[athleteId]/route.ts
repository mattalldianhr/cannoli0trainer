import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

/**
 * GET /api/messages/[athleteId] — Get paginated messages for a conversation.
 * Query params:
 *   - cursor: message ID for pagination (messages before this one)
 *   - limit: number of messages to return (default 50)
 *   - after: message ID to fetch messages after (for polling new messages)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  try {
    const coachId = await getCurrentCoachId();
    const { athleteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const after = searchParams.get('after');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );

    // Find conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        coachId_athleteId: { coachId, athleteId },
      },
      select: { id: true },
    });

    if (!conversation) {
      // No conversation yet — return empty thread
      return NextResponse.json({
        messages: [],
        hasMore: false,
      });
    }

    // Build query conditions
    const whereClause: Record<string, unknown> = {
      conversationId: conversation.id,
    };

    if (after) {
      // Polling: get messages newer than the given ID
      const afterMessage = await prisma.message.findUnique({
        where: { id: after },
        select: { createdAt: true },
      });
      if (afterMessage) {
        whereClause.createdAt = { gt: afterMessage.createdAt };
      }
    } else if (cursor) {
      // Pagination: get messages older than the cursor
      const cursorMessage = await prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        whereClause.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: after ? 'asc' : 'desc' },
      take: limit + 1, // Fetch one extra to check hasMore
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // When fetching older messages (default), reverse to chronological order
    if (!after) messages.reverse();

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
