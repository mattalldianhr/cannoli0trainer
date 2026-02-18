import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { ProgramBuilder } from '@/components/programs/ProgramBuilder';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: program ? `Edit ${program.name} | Cannoli Trainer` : 'Edit Program | Cannoli Trainer',
  };
}

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      workouts: {
        include: {
          exercises: {
            include: {
              exercise: {
                select: { id: true, name: true, category: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
      },
      assignments: {
        include: {
          athlete: {
            select: { id: true, name: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!program) {
    notFound();
  }

  // Transform the Prisma result into the ProgramWithDetails shape
  const programData = {
    ...program,
    startDate: program.startDate?.toISOString() ?? null,
    endDate: program.endDate?.toISOString() ?? null,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
    assignments: program.assignments.map((a) => ({
      id: a.id,
      athleteId: a.athleteId,
      assignedAt: a.assignedAt.toISOString(),
      startDate: a.startDate?.toISOString() ?? null,
      endDate: a.endDate?.toISOString() ?? null,
      athlete: {
        id: a.athlete.id,
        name: a.athlete.name,
      },
    })),
  };

  return (
    <Container className="py-8">
      <ProgramBuilder coachId={program.coachId} initialProgram={programData} />
    </Container>
  );
}
