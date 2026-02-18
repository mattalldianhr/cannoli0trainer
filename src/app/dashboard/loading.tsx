import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <Container className="py-8">
      {/* Header skeleton */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity skeleton */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-6 w-36 bg-muted animate-pulse rounded" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2].map((group) => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded-full" />
                </div>
                <div className="space-y-2 ml-6">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                        <div>
                          <div className="h-4 w-28 bg-muted animate-pulse rounded mb-1" />
                          <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-10 bg-muted animate-pulse rounded-full" />
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Needs Attention skeleton */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-6 w-36 bg-muted animate-pulse rounded" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div>
                    <div className="h-4 w-28 bg-muted animate-pulse rounded mb-1" />
                    <div className="h-3 w-36 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meets skeleton */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div>
                    <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
