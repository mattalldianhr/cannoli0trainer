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

  const athleteInclude = {
    _count: {
      select: {
        setLogs: true,
        workoutSessions: true,
        programAssignments: true,
      },
    },
    workoutSessions: {
      orderBy: { date: 'desc' as const },
      take: 1,
      select: { date: true },
    },
    programAssignments: {
      orderBy: { assignedAt: 'desc' as const },
      take: 1,
      include: {
        program: { select: { name: true } },
      },
    },
  };

  const [activeAthletes, archivedAthletes] = await Promise.all([
    prisma.athlete.findMany({
      where: { coachId, isActive: true },
      include: athleteInclude,
      orderBy: { name: 'asc' },
    }),
    prisma.athlete.findMany({
      where: { coachId, isActive: false },
      include: athleteInclude,
      orderBy: { name: 'asc' },
    }),
  ]);

  const mapAthlete = (athlete: (typeof activeAthletes)[number]) => ({
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    bodyweight: athlete.bodyweight,
    weightClass: athlete.weightClass,
    experienceLevel: athlete.experienceLevel,
    isRemote: athlete.isRemote,
    isCompetitor: athlete.isCompetitor,
    isActive: athlete.isActive,
    federation: athlete.federation,
    notes: athlete.notes,
    _count: athlete._count,
    lastWorkoutDate: athlete.workoutSessions[0]?.date?.toISOString() ?? null,
    currentProgram: athlete.programAssignments[0]?.program?.name ?? null,
  });

  const activeData = activeAthletes.map(mapAthlete);
  const archivedData = archivedAthletes.map(mapAthlete);

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Athletes</h1>
        <p className="text-muted-foreground mt-1">
          Manage your roster of {activeData.length} athlete{activeData.length !== 1 ? 's' : ''}
          {archivedData.length > 0 && ` (${archivedData.length} archived)`}
        </p>
      </div>
      <AthleteList athletes={activeData} archivedAthletes={archivedData} />
    </Container>
  );
}
