'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Question, Answer } from '@/lib/interview/types';

interface MultiChoiceStepProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: string[]) => void;
}

export function MultiChoiceStep({ question, answer, onAnswer }: MultiChoiceStepProps) {
  const selected: string[] = answer && Array.isArray(answer.value) ? answer.value : [];

  function toggleOption(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    onAnswer(next);
  }

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <div key={option.value} className="flex items-start space-x-3 py-2">
          <Checkbox
            id={`${question.id}-${option.value}`}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor={`${question.id}-${option.value}`}
              className="text-sm font-medium cursor-pointer"
            >
              {option.label}
            </Label>
            {option.description && (
              <p className="text-xs text-muted-foreground">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
