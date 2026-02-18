import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { ExerciseList } from '@/components/exercises/ExerciseList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exercise Library | Cannoli Trainer',
};

export default async function ExercisesPage() {
  const coachId = await getCurrentCoachId();
  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ coachId: null }, { coachId }] },
    select: {
      id: true,
      name: true,
      category: true,
      force: true,
      level: true,
      mechanic: true,
      equipment: true,
      primaryMuscles: true,
      tags: true,
      videoUrl: true,
    },
    orderBy: { name: 'asc' },
  });

  const exerciseData = exercises.map((exercise) => ({
    ...exercise,
    primaryMuscles: (exercise.primaryMuscles as string[]) ?? [],
    tags: (exercise.tags as string[]) ?? [],
  }));

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">
          {exerciseData.length} exercise{exerciseData.length !== 1 ? 's' : ''} available
        </p>
      </div>
      <ExerciseList exercises={exerciseData} />
    </Container>
  );
}
