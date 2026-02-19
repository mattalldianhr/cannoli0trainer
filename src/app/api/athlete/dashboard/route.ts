import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAthleteCoachTimezone } from '@/lib/coach';
import { todayDateInTimezone, parseDateForPrisma, getMondayInTimezone, formatPrismaDate } from '@/lib/date-utils';

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

    const tz = await getAthleteCoachTimezone(athleteId);
    const today = todayDateInTimezone(tz);
    const startOfWeek = parseDateForPrisma(getMondayInTimezone(tz));

    const [
      todaySession,
      nextSession,
      weekSessions,
      recentSessions,
      streakSessions,
      activeAssignment,
    ] = await Promise.all([
      // Today's workout
      prisma.workoutSession.findUnique({
        where: { athleteId_date: { athleteId, date: today } },
        include: {
          program: { select: { id: true, name: true } },
        },
      }),

      // Next upcoming session (if no session today)
      prisma.workoutSession.findFirst({
        where: {
          athleteId,
          date: { gt: today },
          status: 'NOT_STARTED',
          isSkipped: false,
        },
        orderBy: { date: 'asc' },
        include: {
          program: { select: { name: true } },
        },
      }),

      // Workouts this week (Mon-Sun)
      prisma.workoutSession.findMany({
        where: {
          athleteId,
          date: { gte: startOfWeek, lte: today },
          isSkipped: false,
          status: { not: 'NOT_STARTED' },
        },
        select: { id: true, completionPercentage: true },
      }),

      // Last 3 completed sessions
      prisma.workoutSession.findMany({
        where: {
          athleteId,
          status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
        },
        orderBy: { date: 'desc' },
        take: 3,
        include: {
          program: { select: { name: true } },
        },
      }),

      // Recent sessions for streak calculation (last 30 days, ordered by date desc)
      prisma.workoutSession.findMany({
        where: {
          athleteId,
          date: {
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: today,
          },
          isSkipped: false,
          status: { in: ['PARTIALLY_COMPLETED', 'FULLY_COMPLETED'] },
        },
        orderBy: { date: 'desc' },
        select: { date: true },
      }),

      // Active program assignment
      prisma.programAssignment.findFirst({
        where: { athleteId, isActive: true },
        orderBy: { assignedAt: 'desc' },
        include: {
          program: { select: { name: true } },
        },
      }),
    ]);

    // Calculate streak: consecutive training days going backwards from today
    let streak = 0;
    if (streakSessions.length > 0) {
      const sessionDates = new Set(
        streakSessions.map((s) => formatPrismaDate(s.date))
      );

      // Walk backwards day by day from today
      const checkDate = new Date(today);
      while (true) {
        const dateStr = formatPrismaDate(checkDate);
        if (sessionDates.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Completion rate (average of week's sessions)
    const completionRate =
      weekSessions.length > 0
        ? Math.round(
            weekSessions.reduce((sum, s) => sum + s.completionPercentage, 0) /
              weekSessions.length
          )
        : 0;

    return NextResponse.json({
      todayWorkout: todaySession
        ? {
            id: todaySession.id,
            title: todaySession.title,
            status: todaySession.status,
            completionPercentage: todaySession.completionPercentage,
            completedItems: todaySession.completedItems,
            totalItems: todaySession.totalItems,
            programName: todaySession.program?.name ?? null,
          }
        : null,
      nextWorkout: !todaySession && nextSession
        ? {
            date: nextSession.date.toISOString(),
            title: nextSession.title,
            programName: nextSession.program?.name ?? null,
          }
        : null,
      stats: {
        streak,
        workoutsThisWeek: weekSessions.length,
        completionRate,
      },
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        title: s.title,
        status: s.status,
        completionPercentage: s.completionPercentage,
        completedItems: s.completedItems,
        totalItems: s.totalItems,
        programName: s.program?.name ?? null,
      })),
      currentProgram: activeAssignment
        ? { name: activeAssignment.program.name }
        : null,
    });
  } catch (error) {
    console.error('Failed to fetch athlete dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
