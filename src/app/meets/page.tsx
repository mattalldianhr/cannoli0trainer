import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { MeetList } from '@/components/meets/MeetList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meets | Cannoli Trainer',
};

export default async function MeetsPage() {
  const coachId = await getCurrentCoachId();

  const meets = await prisma.competitionMeet.findMany({
    where: { coachId },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { date: 'desc' },
  });

  const meetData = meets.map((meet) => ({
    id: meet.id,
    name: meet.name,
    date: meet.date.toISOString(),
    federation: meet.federation,
    location: meet.location,
    athleteCount: meet._count.entries,
  }));

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Meets</h1>
        <p className="text-muted-foreground mt-1">
          Manage competitions and meet day logistics
        </p>
      </div>
      <MeetList meets={meetData} coachId={coachId} />
    </Container>
  );
}
