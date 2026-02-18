import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { AthleteList } from '@/components/athletes/AthleteList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Athletes | Cannoli Trainer',
};

export default async function AthletesPage() {
  const coachId = await getCurrentCoachId();
  const athletes = await prisma.athlete.findMany({
    where: { coachId },
    include: {
      _count: {
        select: {
          setLogs: true,
          workoutSessions: true,
          programAssignments: true,
        },
      },
      workoutSessions: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true },
      },
      programAssignments: {
        orderBy: { assignedAt: 'desc' },
        take: 1,
        include: {
          program: { select: { name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const athleteData = athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    bodyweight: athlete.bodyweight,
    weightClass: athlete.weightClass,
    experienceLevel: athlete.experienceLevel,
    isRemote: athlete.isRemote,
    isCompetitor: athlete.isCompetitor,
    federation: athlete.federation,
    notes: athlete.notes,
    _count: athlete._count,
    lastWorkoutDate: athlete.workoutSessions[0]?.date?.toISOString() ?? null,
    currentProgram: athlete.programAssignments[0]?.program?.name ?? null,
  }));

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Athletes</h1>
        <p className="text-muted-foreground mt-1">
          Manage your roster of {athleteData.length} athlete{athleteData.length !== 1 ? 's' : ''}
        </p>
      </div>
      <AthleteList athletes={athleteData} />
    </Container>
  );
}
