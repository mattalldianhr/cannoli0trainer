import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { scheduleMessageNotification } from '@/lib/messaging';

/**
 * GET /api/messages — Coach inbox: list conversations sorted by most recent message.
 */
export async function GET() {
  try {
    const coachId = await getCurrentCoachId();

    const conversations = await prisma.conversation.findMany({
      where: { coachId },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        athlete: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        athleteId: c.athleteId,
        athleteName: c.athlete.name,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        lastMessagePreview: c.lastMessagePreview,
        unreadCount: c.unreadCountCoach,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages — Coach sends a message to an athlete.
 * Body: { athleteId: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    const { athleteId, content } = body as {
      athleteId?: string;
      content?: string;
    };

    if (!athleteId || !content?.trim()) {
      return NextResponse.json(
        { error: 'athleteId and content are required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // Verify athlete belongs to this coach
    const athlete = await prisma.athlete.findFirst({
      where: { id: athleteId, coachId },
      select: { id: true, name: true, email: true, notificationPreferences: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Upsert conversation (auto-create on first message)
    const conversation = await prisma.conversation.upsert({
      where: {
        coachId_athleteId: { coachId, athleteId },
      },
      create: {
        coachId,
        athleteId,
        lastMessageAt: new Date(),
        lastMessagePreview:
          trimmedContent.length > 100
            ? trimmedContent.slice(0, 100) + '...'
            : trimmedContent,
        unreadCountAthlete: 1,
      },
      update: {
        lastMessageAt: new Date(),
        lastMessagePreview:
          trimmedContent.length > 100
            ? trimmedContent.slice(0, 100) + '...'
            : trimmedContent,
        unreadCountAthlete: { increment: 1 },
      },
    });

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: coachId,
        senderType: 'COACH',
        content: trimmedContent,
      },
    });

    // Schedule delayed email notification (fire-and-forget)
    scheduleMessageNotification(message.id, athleteId).catch(() => {});

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
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
