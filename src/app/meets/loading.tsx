import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';

export default function MeetsLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        <div className="h-5 w-56 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Action button */}
      <div className="flex justify-end mb-6">
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Meet cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-5 w-40 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-56 bg-muted animate-pulse rounded mb-2" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
