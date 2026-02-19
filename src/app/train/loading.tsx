import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';

export default function TrainLoading() {
  return (
    <Container className="py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-4">
        <div className="h-7 w-36 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1" />
      </div>

      {/* Athlete selector */}
      <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-4" />

      {/* Date selector */}
      <div className="h-10 w-40 bg-muted animate-pulse rounded-md mb-6" />

      {/* Exercise cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="h-5 w-44 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-36 bg-muted animate-pulse rounded mb-3" />
              {/* Set rows */}
              <div className="space-y-2">
                {[1, 2, 3].map((set) => (
                  <div key={set} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
                    <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
                    <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
                    <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
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
