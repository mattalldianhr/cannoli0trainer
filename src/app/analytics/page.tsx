import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | Cannoli Trainer',
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ athleteId?: string }>;
}) {
  const { athleteId } = await searchParams;

  const athletes = await prisma.athlete.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track strength trends, volume, compliance, and more
        </p>
      </div>

      <AnalyticsDashboard athletes={athletes} initialAthleteId={athleteId} />
    </Container>
  );
}
