import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { TrainingLog } from '@/components/training/TrainingLog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Training Log | Cannoli Trainer',
};

export default async function TrainPage() {
  const athletes = await prisma.athlete.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const athleteData = athletes.map((a) => ({
    id: a.id,
    name: a.name,
  }));

  return (
    <Container className="py-6 max-w-2xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Training Log</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          View and log today&apos;s workout
        </p>
      </div>
      <TrainingLog athletes={athleteData} />
    </Container>
  );
}
