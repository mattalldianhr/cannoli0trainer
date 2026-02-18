import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { AddAthleteForm } from '@/components/athletes/AddAthleteForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add Athlete | Cannoli Trainer',
};

export default async function NewAthletePage() {
  const coachId = await getCurrentCoachId();

  return (
    <Container className="py-8 max-w-2xl">
      <AddAthleteForm coachId={coachId} />
    </Container>
  );
}
