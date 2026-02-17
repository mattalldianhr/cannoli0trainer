'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Section, Question, Answer } from '@/lib/interview/types';
import { Pencil } from 'lucide-react';

interface ReviewStepProps {
  sections: Section[];
  questions: Question[];
  visibleQuestions: Question[];
  answers: Record<string, Answer>;
  onGoToQuestion: (index: number) => void;
}

function formatAnswer(question: Question, answer: Answer | undefined): string {
  if (!answer) return 'Not answered';
  const val = answer.value;

  if (question.type === 'single-choice' && question.options) {
    const opt = question.options.find((o) => o.value === val);
    return opt ? opt.label : String(val);
  }

  if (question.type === 'multi-choice' && question.options && Array.isArray(val)) {
    if (val.length === 0) return 'None selected';
    return val
      .map((v) => {
        const opt = question.options!.find((o) => o.value === v);
        return opt ? opt.label : v;
      })
      .join(', ');
  }

  if (question.type === 'scale') {
    return `${val} / ${question.scaleMax ?? 10}`;
  }

  if (question.type === 'ranking' && Array.isArray(val)) {
    return val
      .slice(0, 3)
      .map((v, i) => {
        const opt = question.options?.find((o) => o.value === v);
        return `${i + 1}. ${opt ? opt.label : v}`;
      })
      .join(', ');
  }

  return String(val) || 'Not answered';
}

export function ReviewStep({
  sections,
  questions,
  visibleQuestions,
  answers,
  onGoToQuestion,
}: ReviewStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Answers</h2>
        <p className="text-muted-foreground">
          Check your responses below. Click the edit button to jump back to any question.
        </p>
      </div>

      {sections.map((section) => {
        const sectionVisible = visibleQuestions.filter((q) => q.sectionId === section.id);
        if (sectionVisible.length === 0) return null;

        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionVisible.map((q, idx) => {
                const answer = answers[q.id];
                const globalIndex = visibleQuestions.indexOf(q);
                const isAnswered = answer && answer.value !== '' && (
                  !Array.isArray(answer.value) || answer.value.length > 0
                );

                return (
                  <div key={q.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{q.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAnswer(q, answer)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isAnswered && q.required && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onGoToQuestion(globalIndex)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
