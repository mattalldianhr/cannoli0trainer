import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { WeeklyCalendar } from '@/components/schedule/WeeklyCalendar';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Schedule | Cannoli Trainer',
};

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface SchedulePageProps {
  searchParams: Promise<{ week?: string; athleteId?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const currentMonday = getMonday(new Date());

  // Determine which week to display
  let weekStart: string;
  if (params.week) {
    // Validate and normalize to Monday
    const parsed = new Date(params.week + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      weekStart = currentMonday;
    } else {
      weekStart = getMonday(parsed);
    }
  } else {
    weekStart = currentMonday;
  }

  const isCurrentWeek = weekStart === currentMonday;

  // Date range for the week (Monday 00:00 to Sunday 23:59)
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndStr = addDays(weekStart, 6);
  const weekEndDate = new Date(weekEndStr + 'T23:59:59');

  // Fetch all athletes and their sessions for this week
  const coachId = await getCurrentCoachId();
  const athletes = await prisma.athlete.findMany({
    where: { coachId },
    select: {
      id: true,
      name: true,
      workoutSessions: {
        where: {
          date: {
            gte: weekStartDate,
            lte: weekEndDate,
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

  // Transform data for the client component
  const athleteData = athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    sessions: athlete.workoutSessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      title: s.title,
      status: s.status,
      isSkipped: s.isSkipped,
      completionPercentage: s.completionPercentage,
      weekNumber: s.weekNumber,
      dayNumber: s.dayNumber,
    })),
  }));

  // Count total sessions this week
  const totalSessions = athleteData.reduce((sum, a) => sum + a.sessions.length, 0);

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            Weekly training schedule across all athletes
            {totalSessions > 0 && (
              <span className="ml-1">
                &middot; {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'} this week
              </span>
            )}
          </p>
        </div>
      </div>

      <WeeklyCalendar
        athletes={athleteData}
        weekStart={weekStart}
        isCurrentWeek={isCurrentWeek}
      />
    </Container>
  );
}
