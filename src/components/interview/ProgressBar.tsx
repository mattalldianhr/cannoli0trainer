'use client';

import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  sectionName: string | null;
  currentIndex: number;
  totalVisible: number;
  phase: 'questions' | 'review' | 'export';
}

export function ProgressBar({
  progress,
  sectionName,
  currentIndex,
  totalVisible,
  phase,
}: ProgressBarProps) {
  const label =
    phase === 'review'
      ? 'Review'
      : phase === 'export'
        ? 'Complete'
        : `Question ${currentIndex + 1} of ${totalVisible}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {sectionName && phase === 'questions' ? sectionName : ''}
        </span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
