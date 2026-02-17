import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    select: {
      id: true,
      generatedAt: true,
      trainerProfile: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-muted-foreground">
          {submissions.length} interview{submissions.length !== 1 ? 's' : ''} completed
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No submissions yet. Complete an interview to see results here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const profile = sub.trainerProfile as unknown as Record<string, string>;
            return (
              <Link key={sub.id} href={`/submissions/${sub.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      {profile.roles || 'Trainer'}
                      {profile.athleteCount && ` — ${profile.athleteCount} athletes`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {profile.inPersonVsRemote && <p>{profile.inPersonVsRemote}</p>}
                    {profile.facility && <p>{profile.facility}</p>}
                    <p className="text-xs">
                      Submitted {new Date(sub.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
