import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { ExerciseForm } from '@/components/exercises/ExerciseForm';
import { notFound, redirect } from 'next/navigation';

export const metadata = {
  title: 'Edit Exercise | Cannoli Trainer',
};

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const coach = await prisma.coach.findFirst();
  if (!coach) {
    redirect('/exercises');
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      force: true,
      level: true,
      mechanic: true,
      equipment: true,
      videoUrl: true,
      cues: true,
      tags: true,
    },
  });

  if (!exercise) {
    notFound();
  }

  return (
    <Container className="py-8 max-w-2xl">
      <ExerciseForm
        coachId={coach.id}
        exercise={{
          ...exercise,
          tags: (exercise.tags as string[]) ?? [],
        }}
      />
    </Container>
  );
}
