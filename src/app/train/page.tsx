import Link from 'next/link';
import { Dumbbell, UserPlus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { TrainingLog } from '@/components/training/TrainingLog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

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
      {athleteData.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No athletes yet"
          description="Add athletes to start logging their training."
          action={
            <Button asChild>
              <Link href="/athletes/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Athlete
              </Link>
            </Button>
          }
        />
      ) : (
        <TrainingLog athletes={athleteData} />
      )}
    </Container>
  );
}
