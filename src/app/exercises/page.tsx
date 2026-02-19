import { Container } from '@/components/layout/Container';
import { ExerciseList } from '@/components/exercises/ExerciseList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exercise Library | Cannoli Trainer',
};

export default function ExercisesPage() {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
      </div>
      <ExerciseList />
    </Container>
  );
}
