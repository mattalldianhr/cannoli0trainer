'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AthleteComparisonView } from './AthleteComparisonView';
import { User, Users } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
}

interface AnalyticsPageClientProps {
  athletes: Athlete[];
  initialAthleteId?: string;
  initialView?: 'individual' | 'compare';
}

export function AnalyticsPageClient({
  athletes,
  initialAthleteId,
  initialView = 'individual',
}: AnalyticsPageClientProps) {
  const [view, setView] = useState<'individual' | 'compare'>(initialView);

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-input p-1 w-fit">
        <Button
          variant={view === 'individual' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView('individual')}
        >
          <User className="h-4 w-4 mr-1.5" />
          Individual
        </Button>
        <Button
          variant={view === 'compare' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView('compare')}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Compare
        </Button>
      </div>

      {view === 'individual' ? (
        <AnalyticsDashboard athletes={athletes} initialAthleteId={initialAthleteId} />
      ) : (
        <AthleteComparisonView athletes={athletes} />
      )}
    </div>
  );
}
