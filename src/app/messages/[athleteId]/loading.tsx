import { Container } from '@/components/layout/Container';

export default function MessageThreadLoading() {
  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
          <div className="h-5 w-2 bg-muted animate-pulse rounded" />
          <div className="h-6 w-36 bg-muted animate-pulse rounded" />
        </div>

        {/* Thread skeleton */}
        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-background p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`animate-pulse rounded-2xl ${
                  i % 2 === 0 ? 'bg-primary/20' : 'bg-muted'
                } ${i % 3 === 0 ? 'h-10 w-48' : 'h-8 w-36'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
