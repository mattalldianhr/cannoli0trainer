import { Container } from '@/components/layout/Container';

export default function MessagesLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-muted animate-pulse rounded" />
          <div className="h-9 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-5 w-56 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Conversation list skeleton */}
      <div className="max-w-2xl space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </Container>
  );
}
