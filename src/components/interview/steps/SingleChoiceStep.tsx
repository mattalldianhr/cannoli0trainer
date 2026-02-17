'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Question, Answer } from '@/lib/interview/types';
import { useState, useEffect } from 'react';

interface SingleChoiceStepProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: string) => void;
}

export function SingleChoiceStep({ question, answer, onAnswer }: SingleChoiceStepProps) {
  const currentValue = answer ? String(answer.value) : '';
  const [otherText, setOtherText] = useState('');

  // If the stored value doesn't match any known option, it's the "other" text
  useEffect(() => {
    if (currentValue && question.options) {
      const isKnownValue = question.options.some((o) => o.value === currentValue);
      if (!isKnownValue) {
        setOtherText(currentValue);
      }
    }
  }, [currentValue, question.options]);

  const hasOtherOption = question.options?.some((o) => o.value === 'other');

  return (
    <div className="space-y-4">
      <RadioGroup value={currentValue} onValueChange={onAnswer}>
        {question.options?.map((option) => (
          <div key={option.value} className="flex items-start space-x-3 py-2">
            <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
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
      </RadioGroup>

      {hasOtherOption && currentValue === 'other' && (
        <div className="ml-7 mt-2">
          <Input
            placeholder="Please specify..."
            value={otherText}
            onChange={(e) => {
              setOtherText(e.target.value);
            }}
            onBlur={() => {
              if (otherText.trim()) {
                onAnswer(otherText.trim());
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
