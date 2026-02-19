import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';

export default function AthletesLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-56 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="h-10 w-full sm:w-72 bg-muted animate-pulse rounded-md" />
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Athlete cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
