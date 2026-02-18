import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { ProgramBuilder } from '@/components/programs/ProgramBuilder';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'New Program | Cannoli Trainer',
};

export default async function NewProgramPage() {
  const coach = await prisma.coach.findFirst();

  if (!coach) {
    redirect('/programs');
  }

  return (
    <Container className="py-8">
      <ProgramBuilder coachId={coach.id} />
    </Container>
  );
}
