import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPrismaDate, parseDateForPrisma } from '@/lib/date-utils';

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

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required query params: startDate, endDate' },
        { status: 400 }
      );
    }

    const start = parseDateForPrisma(startDate);
    const end = parseDateForPrisma(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        athleteId,
        date: { gte: start, lte: end },
      },
      select: {
        id: true,
        date: true,
        title: true,
        status: true,
        isSkipped: true,
        completionPercentage: true,
        completedItems: true,
        totalItems: true,
        weekNumber: true,
        dayNumber: true,
        program: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Completion stats for the range
    const completed = sessions.filter(
      (s) => s.status === 'FULLY_COMPLETED' && !s.isSkipped
    ).length;
    const total = sessions.filter((s) => !s.isSkipped).length;

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        date: formatPrismaDate(s.date),
        title: s.title,
        status: s.status,
        isSkipped: s.isSkipped,
        completionPercentage: s.completionPercentage,
        completedItems: s.completedItems,
        totalItems: s.totalItems,
        weekNumber: s.weekNumber,
        dayNumber: s.dayNumber,
        programName: s.program?.name ?? null,
      })),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    console.error('Failed to fetch athlete calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
