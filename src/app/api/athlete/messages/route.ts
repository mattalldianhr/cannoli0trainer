import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/athlete/messages — Get paginated messages for the athlete's conversation with their coach.
 * Query params:
 *   - cursor: message ID for pagination (messages before this one)
 *   - limit: number of messages to return (default 50)
 *   - after: message ID to fetch messages after (for polling new messages)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const athleteId = session?.user?.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const after = searchParams.get('after');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );

    // Find the athlete's conversation
    const conversation = await prisma.conversation.findFirst({
      where: { athleteId },
      select: { id: true },
    });

    if (!conversation) {
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
      const afterMessage = await prisma.message.findUnique({
        where: { id: after },
        select: { createdAt: true },
      });
      if (afterMessage) {
        whereClause.createdAt = { gt: afterMessage.createdAt };
      }
    } else if (cursor) {
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
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

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
    console.error('Failed to fetch athlete messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/athlete/messages — Athlete sends a message to their coach.
 * Body: { content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const athleteId = session?.user?.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body as { content?: string };

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // Get athlete's coach
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { coachId: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Upsert conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        coachId_athleteId: {
          coachId: athlete.coachId,
          athleteId,
        },
      },
      create: {
        coachId: athlete.coachId,
        athleteId,
        lastMessageAt: new Date(),
        lastMessagePreview:
          trimmedContent.length > 100
            ? trimmedContent.slice(0, 100) + '...'
            : trimmedContent,
        unreadCountCoach: 1,
      },
      update: {
        lastMessageAt: new Date(),
        lastMessagePreview:
          trimmedContent.length > 100
            ? trimmedContent.slice(0, 100) + '...'
            : trimmedContent,
        unreadCountCoach: { increment: 1 },
      },
    });

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: athleteId,
        senderType: 'ATHLETE',
        content: trimmedContent,
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        readAt: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to send athlete message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
