import { Container } from '@/components/layout/Container';

export default function ScheduleLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-36 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
        <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
        <div className="h-5 w-32 bg-muted animate-pulse rounded ml-2" />
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-3 text-center">
              <div className="h-4 w-8 bg-muted animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Athlete rows */}
        {[1, 2, 3, 4, 5].map((athlete) => (
          <div key={athlete} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-3 flex items-center gap-2">
              <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="p-2 min-h-[64px]">
                {day <= 4 && (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Container>
  );
}
