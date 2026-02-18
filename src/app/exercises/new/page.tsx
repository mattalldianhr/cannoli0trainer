import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { AddExerciseForm } from '@/components/exercises/AddExerciseForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add Exercise | Cannoli Trainer',
};

export default async function NewExercisePage() {
  const coachId = await getCurrentCoachId();

  return (
    <Container className="py-8 max-w-2xl">
      <AddExerciseForm coachId={coachId} />
    </Container>
  );
}
