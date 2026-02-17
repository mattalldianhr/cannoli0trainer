'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Question, Answer } from '@/lib/interview/types';

interface TextInputStepProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: string) => void;
}

export function TextInputStep({ question, answer, onAnswer }: TextInputStepProps) {
  const currentValue = answer ? String(answer.value) : '';

  if (question.type === 'textarea') {
    return (
      <Textarea
        value={currentValue}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={question.placeholder}
        rows={5}
        className="resize-y"
      />
    );
  }

  return (
    <Input
      value={currentValue}
      onChange={(e) => onAnswer(e.target.value)}
      placeholder={question.placeholder}
    />
  );
}
