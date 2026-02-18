import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { ProgramBuilder } from '@/components/programs/ProgramBuilder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'New Program | Cannoli Trainer',
};

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const { templateId } = await searchParams;
  const coachId = await getCurrentCoachId();

  // If templateId is provided, fetch the template to pre-populate the builder
  let templateData = undefined;
  if (templateId) {
    const template = await prisma.program.findUnique({
      where: { id: templateId, isTemplate: true, coachId },
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
        },
      },
    });

    if (template) {
      templateData = {
        ...template,
        startDate: template.startDate?.toISOString() ?? null,
        endDate: template.endDate?.toISOString() ?? null,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        assignments: template.assignments.map((a) => ({
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
    }
  }

  return (
    <Container className="py-8">
      <ProgramBuilder coachId={coachId} templateProgram={templateData} />
    </Container>
  );
}
