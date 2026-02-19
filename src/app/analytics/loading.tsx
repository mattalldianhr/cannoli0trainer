import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AnalyticsLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Controls: athlete selector + date range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
        <div className="flex gap-2">
          {['4W', '8W', '12W', 'All'].map((range) => (
            <div key={range} className="h-9 w-14 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
        <div className="ml-auto h-9 w-28 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['E1RM Trends', 'Weekly Volume', 'Compliance', 'RPE Distribution'].map((title) => (
          <Card key={title}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
