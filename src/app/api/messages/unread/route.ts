import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

/**
 * GET /api/messages/unread — Get total unread message count for the coach.
 * Used for the header nav badge (polled every 60s).
 */
export async function GET() {
  try {
    const coachId = await getCurrentCoachId();

    const result = await prisma.conversation.aggregate({
      where: { coachId },
      _sum: { unreadCountCoach: true },
    });

    return NextResponse.json({
      unreadCount: result._sum.unreadCountCoach ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
