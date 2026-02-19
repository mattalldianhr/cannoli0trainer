import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProgramDetailLoading() {
  return (
    <Container className="py-8">
      {/* Back link */}
      <div className="h-5 w-28 bg-muted animate-pulse rounded mb-4" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="h-8 w-56 bg-muted animate-pulse rounded mb-2" />
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Overview grid */}
      <Card className="mb-6">
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workout details */}
      {[1, 2].map((week) => (
        <Card key={week} className="mb-4">
          <CardHeader>
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((ex) => (
                <div key={ex} className="flex items-center gap-3 p-2 rounded border">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="ml-auto h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}
