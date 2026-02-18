import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { MeetDetail } from '@/components/meets/MeetDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meet = await prisma.competitionMeet.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: meet ? `${meet.name} | Cannoli Trainer` : 'Meet Not Found',
  };
}

export default async function MeetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coachId = await getCurrentCoachId();

  const meet = await prisma.competitionMeet.findUnique({
    where: { id, coachId },
    include: {
      coach: { select: { id: true, name: true } },
      entries: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              weightClass: true,
              bodyweight: true,
            },
          },
        },
        orderBy: { athlete: { name: 'asc' } },
      },
    },
  });

  if (!meet) {
    notFound();
  }

  // Get athletes already in the meet to exclude from the add dialog
  const entryAthleteIds = meet.entries.map((e) => e.athleteId);

  // Get all athletes for the add dialog
  const allAthletes = await prisma.athlete.findMany({
    where: { coachId: meet.coachId, isActive: true },
    select: { id: true, name: true, weightClass: true, bodyweight: true },
    orderBy: { name: 'asc' },
  });

  // Get current maxes for SBD exercises for all entered athletes
  const sbdMaxes = entryAthleteIds.length > 0
    ? await prisma.maxSnapshot.findMany({
        where: {
          athleteId: { in: entryAthleteIds },
          isCurrentMax: true,
          exercise: {
            name: {
              in: [
                'Barbell Squat',
                'Barbell Bench Press - Medium Grip',
                'Barbell Deadlift',
                // Common alternate names from TeamBuildr mapping
                'Back Squat',
                'Comp Squat',
                'Comp Bench',
                'Comp Deadlift',
                'Competition Squat',
                'Competition Bench Press',
                'Competition Deadlift',
              ],
            },
          },
        },
        include: {
          exercise: { select: { id: true, name: true } },
        },
      })
    : [];

  // Group maxes by athlete
  const maxesByAthlete: Record<string, { squat?: number; bench?: number; deadlift?: number }> = {};
  for (const snap of sbdMaxes) {
    if (!maxesByAthlete[snap.athleteId]) {
      maxesByAthlete[snap.athleteId] = {};
    }
    const exerciseName = snap.exercise.name.toLowerCase();
    const maxVal = snap.workingMax ?? snap.generatedMax ?? 0;
    if (exerciseName.includes('squat')) {
      const current = maxesByAthlete[snap.athleteId].squat ?? 0;
      if (maxVal > current) maxesByAthlete[snap.athleteId].squat = maxVal;
    } else if (exerciseName.includes('bench')) {
      const current = maxesByAthlete[snap.athleteId].bench ?? 0;
      if (maxVal > current) maxesByAthlete[snap.athleteId].bench = maxVal;
    } else if (exerciseName.includes('deadlift')) {
      const current = maxesByAthlete[snap.athleteId].deadlift ?? 0;
      if (maxVal > current) maxesByAthlete[snap.athleteId].deadlift = maxVal;
    }
  }

  const meetData = {
    id: meet.id,
    name: meet.name,
    date: meet.date.toISOString(),
    federation: meet.federation,
    location: meet.location,
    coachId: meet.coachId,
    entries: meet.entries.map((entry) => ({
      id: entry.id,
      athleteId: entry.athleteId,
      athleteName: entry.athlete.name,
      athleteBodyweight: entry.athlete.bodyweight,
      weightClass: entry.weightClass ?? entry.athlete.weightClass ?? null,
      squat1: entry.squat1,
      squat2: entry.squat2,
      squat3: entry.squat3,
      bench1: entry.bench1,
      bench2: entry.bench2,
      bench3: entry.bench3,
      deadlift1: entry.deadlift1,
      deadlift2: entry.deadlift2,
      deadlift3: entry.deadlift3,
      notes: entry.notes,
      attemptResults: entry.attemptResults as Record<string, { weight: number; good: boolean }[]> | null,
      estimatedMaxes: maxesByAthlete[entry.athleteId] ?? {},
    })),
  };

  const availableAthletes = allAthletes.filter(
    (a) => !entryAthleteIds.includes(a.id)
  );

  return (
    <Container className="py-8">
      <MeetDetail meet={meetData} availableAthletes={availableAthletes} />
    </Container>
  );
}
