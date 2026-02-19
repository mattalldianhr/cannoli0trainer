import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/athlete/coach — Get the athlete's coach name.
 */
export async function GET() {
  try {
    const session = await auth();
    const athleteId = session?.user?.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        coach: {
          select: { name: true },
        },
      },
    });

    if (!athlete?.coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ name: athlete.coach.name });
  } catch (error) {
    console.error('Failed to fetch coach info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach info' },
      { status: 500 }
    );
  }
}
