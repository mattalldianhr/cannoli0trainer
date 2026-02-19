import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { MessageThread } from '@/components/messaging/MessageThread';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { name: true },
  });
  return {
    title: athlete ? `Message ${athlete.name} | Cannoli Trainer` : 'Message Not Found',
  };
}

export default async function CoachMessageThreadPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const coachId = await getCurrentCoachId();

  // Verify athlete belongs to this coach
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId, coachId },
    select: { id: true, name: true },
  });

  if (!athlete) {
    notFound();
  }

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Messages
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold truncate">{athlete.name}</h1>
        </div>

        {/* Thread */}
        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-background">
          <MessageThread mode="coach" athleteId={athlete.id} />
        </div>
      </div>
    </Container>
  );
}
