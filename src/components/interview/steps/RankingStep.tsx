'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Question, Answer } from '@/lib/interview/types';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface RankingStepProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: string[]) => void;
}

export function RankingStep({ question, answer, onAnswer }: RankingStepProps) {
  const options = question.options ?? [];
  const ranked: string[] =
    answer && Array.isArray(answer.value) ? answer.value : options.map((o) => o.value);

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...ranked];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onAnswer(next);
  }

  function moveDown(index: number) {
    if (index === ranked.length - 1) return;
    const next = [...ranked];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onAnswer(next);
  }

  return (
    <div className="space-y-2">
      {ranked.map((value, index) => {
        const opt = options.find((o) => o.value === value);
        return (
          <div
            key={value}
            className={cn(
              'flex items-center gap-3 rounded-md border p-3',
              index < 3 ? 'border-primary/50 bg-primary/5' : 'border-border'
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {index + 1}
            </span>
            <span className="flex-1 text-sm">{opt?.label ?? value}</span>
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveDown(index)}
                disabled={index === ranked.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground mt-2">
        Use the arrows to reorder. Top 3 are highlighted.
      </p>
    </div>
  );
}
