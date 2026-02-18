import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
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

export default async function DashboardPage() {
  const stats = await getDashboardStats();

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
      icon: Users,
      href: undefined,
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
      )}
    </Container>
  );
}
