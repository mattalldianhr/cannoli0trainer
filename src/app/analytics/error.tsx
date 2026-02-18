'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics error:', error);
    }
  }, [error]);

  return (
    <Container className="py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          There was an error loading analytics. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </Container>
  );
}
