import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { TemplateList } from '@/components/programs/TemplateList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Templates | Cannoli Trainer',
};

export default async function TemplatesPage() {
  const templates = await prisma.program.findMany({
    where: { isTemplate: true, isArchived: false },
    include: {
      _count: {
        select: {
          workouts: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const templateData = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    type: t.type,
    periodizationType: t.periodizationType,
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    updatedAt: t.updatedAt.toISOString(),
    _count: t._count,
  }));

  return (
    <Container className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Programs
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Reusable program structures to speed up programming
          </p>
        </div>
      </div>
      <TemplateList templates={templateData} />
    </Container>
  );
}
