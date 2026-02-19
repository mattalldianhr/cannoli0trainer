'use client';

import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function MessagesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-8">
      <EmptyState
        icon={MessageSquare}
        title="Something went wrong"
        description="Failed to load messages. Please try again."
        action={
          <button
            onClick={reset}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        }
      />
    </Container>
  );
}
