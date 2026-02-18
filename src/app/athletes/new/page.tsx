import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { AddAthleteForm } from '@/components/athletes/AddAthleteForm';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Add Athlete | Cannoli Trainer',
};

export default async function NewAthletePage() {
  const coach = await prisma.coach.findFirst();

  if (!coach) {
    redirect('/athletes');
  }

  return (
    <Container className="py-8 max-w-2xl">
      <AddAthleteForm coachId={coach.id} />
    </Container>
  );
}
