import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  ClipboardList,
  Dumbbell,
  Plus,
  UserPlus,
  BarChart3,
  Activity,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | Cannoli Trainer',
};

async function getDashboardStats() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalAthletes,
    activePrograms,
    workoutsThisWeek,
    athletesNeedingAttention,
  ] = await Promise.all([
    prisma.athlete.count(),
    prisma.program.count({
      where: { isTemplate: false },
    }),
    prisma.workoutSession.count({
      where: {
        date: { gte: startOfWeek },
      },
    }),
    prisma.athlete.count({
      where: {
        workoutSessions: {
          none: {
            date: {
              gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    }),
  ]);

  return {
    totalAthletes,
    activePrograms,
    workoutsThisWeek,
    athletesNeedingAttention,
  };
}

async function getRecentActivity() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      date: { gte: sevenDaysAgo },
    },
    include: {
      athlete: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Group sessions by date
  const grouped = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const dateKey = session.date.toISOString().split('T')[0];
    const group = grouped.get(dateKey);
    if (group) {
      group.push(session);
    } else {
      grouped.set(dateKey, [session]);
    }
  }

  return grouped;
}

async function getAthletesNeedingAttention() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const athletes = await prisma.athlete.findMany({
    where: {
      workoutSessions: {
        none: {
          date: { gte: threeDaysAgo },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      workoutSessions: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    lastSessionDate: athlete.workoutSessions[0]?.date ?? null,
  }));
}

export default async function DashboardPage() {
  const [stats, recentActivity, athletesNeedingAttention] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getAthletesNeedingAttention(),
  ]);

  const statCards = [
    {
      title: 'Total Athletes',
      value: stats.totalAthletes,
      icon: Users,
      href: '/athletes',
    },
    {
      title: 'Active Programs',
      value: stats.activePrograms,
      icon: ClipboardList,
      href: '/programs',
    },
    {
      title: 'Workouts This Week',
      value: stats.workoutsThisWeek,
      icon: Dumbbell,
      href: undefined,
    },
    {
      title: 'Needs Attention',
      value: stats.athletesNeedingAttention,
      icon: AlertTriangle,
      href: '#needs-attention',
    },
  ];

  return (
    <Container className="py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your coaching practice
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/programs/new" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Program
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/athletes/new" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add Athlete
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>

      {stats.totalAthletes === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No athletes yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first athlete to start building programs and tracking training.
            </p>
            <Button asChild>
              <Link href="/athletes/new" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Add your first athlete
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const content = (
              <Card key={card.title} className={card.href ? 'hover:shadow-md transition-shadow' : ''}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            );

            if (card.href) {
              return (
                <Link key={card.title} href={card.href}>
                  {content}
                </Link>
              );
            }
            return <div key={card.title}>{content}</div>;
          })}
        </div>

        {/* Recent Activity Feed */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Badge variant="secondary">{recentActivity.size > 0 ? 'Last 7 days' : 'No activity'}</Badge>
          </CardHeader>
          <CardContent>
            {recentActivity.size === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No training sessions in the last 7 days.
              </p>
            ) : (
              <div className="space-y-6">
                {Array.from(recentActivity.entries()).map(([dateKey, sessions]) => {
                  const date = new Date(dateKey + 'T00:00:00');
                  const isToday = dateKey === new Date().toISOString().split('T')[0];
                  const isYesterday = (() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return dateKey === yesterday.toISOString().split('T')[0];
                  })();

                  const dateLabel = isToday
                    ? 'Today'
                    : isYesterday
                      ? 'Yesterday'
                      : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground">{dateLabel}</h3>
                        <Badge variant="outline" className="text-xs">
                          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6">
                        {sessions.map((session) => (
                          <Link
                            key={session.id}
                            href={`/athletes/${session.athleteId}`}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {session.athlete.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{session.athlete.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.title || 'Training session'}
                                  {session.totalItems > 0 && (
                                    <> &middot; {session.completedItems}/{session.totalItems} exercises</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.totalItems > 0 && (
                                <Badge
                                  variant={session.completionPercentage >= 100 ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {Math.round(session.completionPercentage)}%
                                </Badge>
                              )}
                              <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention Section */}
        <Card className="mt-8" id="needs-attention">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Needs Attention
            </CardTitle>
            <Badge variant="secondary">
              {athletesNeedingAttention.length} {athletesNeedingAttention.length === 1 ? 'athlete' : 'athletes'}
            </Badge>
          </CardHeader>
          <CardContent>
            {athletesNeedingAttention.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                All athletes have logged sessions in the last 3 days.
              </p>
            ) : (
              <div className="space-y-2">
                {athletesNeedingAttention.map((athlete) => {
                  const daysSince = athlete.lastSessionDate
                    ? Math.floor(
                        (Date.now() - athlete.lastSessionDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <Link
                      key={athlete.id}
                      href={`/athletes/${athlete.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                          {athlete.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {athlete.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {daysSince !== null ? (
                            <span>{daysSince} {daysSince === 1 ? 'day' : 'days'} ago</span>
                          ) : (
                            <span>No sessions</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}
    </Container>
  );
}
