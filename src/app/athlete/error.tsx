'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AthleteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Athlete portal error:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        There was an error loading this page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
