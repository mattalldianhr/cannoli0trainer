import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AthleteProfileLoading() {
  return (
    <Container className="py-8">
      {/* Back link */}
      <div className="h-5 w-24 bg-muted animate-pulse rounded mb-4" />

      {/* Profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {['Overview', 'Training', 'Analytics', 'Meets'].map((tab) => (
          <div key={tab} className="h-5 w-20 bg-muted animate-pulse rounded mb-2" />
        ))}
      </div>

      {/* Content area */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 w-36 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
