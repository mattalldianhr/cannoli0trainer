'use client';

import type { Question, Answer, Section, PRDOutput } from '@/lib/interview/types';
import { SingleChoiceStep } from './steps/SingleChoiceStep';
import { MultiChoiceStep } from './steps/MultiChoiceStep';
import { TextInputStep } from './steps/TextInputStep';
import { ScaleStep } from './steps/ScaleStep';
import { RankingStep } from './steps/RankingStep';
import { ReviewStep } from './steps/ReviewStep';
import { ExportStep } from './steps/ExportStep';

interface StepRendererProps {
  phase: 'questions' | 'review' | 'export';
  question: Question | null;
  answer: Answer | undefined;
  onAnswer: (value: Answer['value']) => void;
  // Review props
  sections: Section[];
  allQuestions: Question[];
  visibleQuestions: Question[];
  answers: Record<string, Answer>;
  onGoToQuestion: (index: number) => void;
  // Export props
  prd: PRDOutput | null;
  onReset: () => void;
}

export function StepRenderer({
  phase,
  question,
  answer,
  onAnswer,
  sections,
  allQuestions,
  visibleQuestions,
  answers,
  onGoToQuestion,
  prd,
  onReset,
}: StepRendererProps) {
  if (phase === 'review') {
    return (
      <ReviewStep
        sections={sections}
        questions={allQuestions}
        visibleQuestions={visibleQuestions}
        answers={answers}
        onGoToQuestion={onGoToQuestion}
      />
    );
  }

  if (phase === 'export' && prd) {
    return <ExportStep prd={prd} onReset={onReset} />;
  }

  if (!question) return null;

  switch (question.type) {
    case 'single-choice':
      return (
        <SingleChoiceStep
          question={question}
          answer={answer}
          onAnswer={(val) => onAnswer(val)}
        />
      );
    case 'multi-choice':
      return (
        <MultiChoiceStep
          question={question}
          answer={answer}
          onAnswer={(val) => onAnswer(val)}
        />
      );
    case 'text':
    case 'textarea':
      return (
        <TextInputStep
          question={question}
          answer={answer}
          onAnswer={(val) => onAnswer(val)}
        />
      );
    case 'scale':
      return (
        <ScaleStep
          question={question}
          answer={answer}
          onAnswer={(val) => onAnswer(val)}
        />
      );
    case 'ranking':
      return (
        <RankingStep
          question={question}
          answer={answer}
          onAnswer={(val) => onAnswer(val)}
        />
      );
    default:
      return <p className="text-muted-foreground">Unknown question type.</p>;
  }
}
