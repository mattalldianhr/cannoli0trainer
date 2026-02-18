import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { AddExerciseForm } from '@/components/exercises/AddExerciseForm';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Add Exercise | Cannoli Trainer',
};

export default async function NewExercisePage() {
  const coach = await prisma.coach.findFirst();

  if (!coach) {
    redirect('/exercises');
  }

  return (
    <Container className="py-8 max-w-2xl">
      <AddExerciseForm coachId={coach.id} />
    </Container>
  );
}
