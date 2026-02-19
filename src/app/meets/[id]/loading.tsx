import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function MeetDetailLoading() {
  return (
    <Container className="py-8">
      {/* Back link */}
      <div className="h-5 w-20 bg-muted animate-pulse rounded mb-4" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Athlete entries */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {['Squat', 'Bench', 'Deadlift'].map((lift) => (
                  <div key={lift}>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="space-y-1">
                      {[1, 2, 3].map((attempt) => (
                        <div key={attempt} className="h-8 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
