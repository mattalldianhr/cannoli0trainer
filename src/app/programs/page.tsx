import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { ProgramList } from '@/components/programs/ProgramList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Programs | Cannoli Trainer',
};

export default async function ProgramsPage() {
  const coachId = await getCurrentCoachId();
  const programs = await prisma.program.findMany({
    where: { coachId, isArchived: false },
    include: {
      _count: {
        select: {
          workouts: true,
          assignments: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const programData = programs.map((program) => ({
    id: program.id,
    name: program.name,
    description: program.description,
    type: program.type,
    periodizationType: program.periodizationType,
    isTemplate: program.isTemplate,
    startDate: program.startDate?.toISOString() ?? null,
    endDate: program.endDate?.toISOString() ?? null,
    updatedAt: program.updatedAt.toISOString(),
    _count: program._count,
  }));

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground mt-1">
          Build and manage training programs for your athletes
        </p>
      </div>
      <ProgramList programs={programData} />
    </Container>
  );
}
