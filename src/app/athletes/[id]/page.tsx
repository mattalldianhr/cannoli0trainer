import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { AthleteProfile } from '@/components/athletes/AthleteProfile';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: athlete ? `${athlete.name} | Cannoli Trainer` : 'Athlete Not Found',
  };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coachId = await getCurrentCoachId();

  const athlete = await prisma.athlete.findUnique({
    where: { id, coachId },
    include: {
      coach: {
        select: { id: true, name: true, brandName: true },
      },
      programAssignments: {
        include: {
          program: {
            select: { id: true, name: true, type: true, startDate: true, endDate: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
      workoutSessions: {
        orderBy: { date: 'desc' },
        take: 20,
        select: {
          id: true,
          date: true,
          status: true,
          completionPercentage: true,
          completedItems: true,
          totalItems: true,
          title: true,
        },
      },
      maxSnapshots: {
        where: { isCurrentMax: true },
        include: {
          exercise: { select: { id: true, name: true, category: true } },
        },
        orderBy: { workingMax: 'desc' },
      },
      bodyweightLogs: {
        orderBy: { loggedAt: 'asc' },
        take: 200,
        select: {
          id: true,
          weight: true,
          unit: true,
          loggedAt: true,
        },
      },
      meetEntries: {
        include: {
          meet: { select: { id: true, name: true, date: true, location: true, federation: true } },
        },
        orderBy: { meet: { date: 'desc' } },
      },
      _count: {
        select: {
          setLogs: true,
          workoutSessions: true,
          programAssignments: true,
          bodyweightLogs: true,
          meetEntries: true,
          maxSnapshots: true,
        },
      },
    },
  });

  if (!athlete) {
    notFound();
  }

  // Serialize dates for client component
  const athleteData = {
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
    createdAt: athlete.createdAt.toISOString(),
    coach: athlete.coach,
    programAssignments: athlete.programAssignments.map((pa) => ({
      id: pa.id,
      assignedAt: pa.assignedAt.toISOString(),
      program: {
        id: pa.program.id,
        name: pa.program.name,
        type: pa.program.type,
        startDate: pa.program.startDate?.toISOString() ?? null,
        endDate: pa.program.endDate?.toISOString() ?? null,
      },
    })),
    workoutSessions: athlete.workoutSessions.map((ws) => ({
      id: ws.id,
      date: ws.date.toISOString(),
      status: ws.status,
      completionPercentage: ws.completionPercentage,
      completedItems: ws.completedItems,
      totalItems: ws.totalItems,
      title: ws.title,
    })),
    currentMaxes: athlete.maxSnapshots.map((ms) => ({
      id: ms.id,
      workingMax: ms.workingMax,
      generatedMax: ms.generatedMax,
      date: ms.date.toISOString(),
      exercise: ms.exercise,
    })),
    bodyweightLogs: athlete.bodyweightLogs.map((bw) => ({
      id: bw.id,
      weight: bw.weight,
      unit: bw.unit,
      loggedAt: bw.loggedAt.toISOString(),
    })),
    meetEntries: athlete.meetEntries.map((me) => ({
      id: me.id,
      weightClass: me.weightClass,
      squat1: me.squat1,
      squat2: me.squat2,
      squat3: me.squat3,
      bench1: me.bench1,
      bench2: me.bench2,
      bench3: me.bench3,
      deadlift1: me.deadlift1,
      deadlift2: me.deadlift2,
      deadlift3: me.deadlift3,
      meet: {
        id: me.meet.id,
        name: me.meet.name,
        date: me.meet.date.toISOString(),
        location: me.meet.location,
        federation: me.meet.federation,
      },
    })),
    _count: athlete._count,
  };

  return (
    <Container className="py-8">
      <AthleteProfile athlete={athleteData} />
    </Container>
  );
}
