import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { formatPrismaDate, parseDateForPrisma } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const athleteId = searchParams.get('athleteId');

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

    if (start > end) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      );
    }

    // Build athlete filter — always scope to current coach
    const coachId = await getCurrentCoachId();
    const athleteWhere: Record<string, unknown> = { coachId, isActive: true };
    if (athleteId && athleteId !== 'all') {
      athleteWhere.id = athleteId;
    }

    const athletes = await prisma.athlete.findMany({
      where: athleteWhere,
      select: {
        id: true,
        name: true,
        workoutSessions: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            id: true,
            date: true,
            title: true,
            status: true,
            isSkipped: true,
            completionPercentage: true,
            weekNumber: true,
            dayNumber: true,
          },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      sessions: athlete.workoutSessions.map((s) => ({
        id: s.id,
        date: formatPrismaDate(s.date),
        title: s.title,
        status: s.status,
        isSkipped: s.isSkipped,
        completionPercentage: s.completionPercentage,
        weekNumber: s.weekNumber,
        dayNumber: s.dayNumber,
      })),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
