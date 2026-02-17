'use client';

import { cn } from '@/lib/utils';
import type { Question, Answer } from '@/lib/interview/types';

interface ScaleStepProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: number) => void;
}

export function ScaleStep({ question, answer, onAnswer }: ScaleStepProps) {
  const min = question.scaleMin ?? 1;
  const max = question.scaleMax ?? 10;
  const currentValue = answer ? Number(answer.value) : null;

  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {values.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onAnswer(n)}
            className={cn(
              'h-11 w-11 rounded-md border text-sm font-medium transition-colors',
              'hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              currentValue === n
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-foreground'
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {question.scaleLabels && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{question.scaleLabels.min}</span>
          <span>{question.scaleLabels.max}</span>
        </div>
      )}
    </div>
  );
}
