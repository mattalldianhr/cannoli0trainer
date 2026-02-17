import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PRDSection {
  title: string;
  content: string;
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission) notFound();

  const profile = submission.trainerProfile as unknown as Record<string, string>;
  const sections = submission.sections as unknown as PRDSection[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to submissions
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{profile.roles || 'Trainer'} PRD</h1>
        <p className="text-sm text-muted-foreground">
          Generated {new Date(submission.generatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {Object.keys(profile).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trainer Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {Object.entries(profile).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PRD Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section, idx) => (
            <div key={idx}>
              {idx > 0 && <Separator className="mb-4" />}
              <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content || 'No data provided.'}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
