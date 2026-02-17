'use client';

import { useMemo } from 'react';
import { useInterview } from '@/hooks/useInterview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressBar } from './ProgressBar';
import { StepRenderer } from './StepRenderer';
import { WelcomeStep } from './steps/WelcomeStep';
import { generatePRD } from '@/lib/interview/prd-generator';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

export function InterviewShell() {
  const {
    answers,
    currentQuestion,
    currentIndex,
    totalVisible,
    progress,
    section,
    setAnswer,
    next,
    prev,
    goTo,
    reset,
    isFirst,
    phase,
    visibleQuestions,
    sections,
    allQuestions,
  } = useInterview();

  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sections) {
      counts[s.id] = visibleQuestions.filter((q) => q.sectionId === s.id).length;
    }
    return counts;
  }, [sections, visibleQuestions]);

  const prd = useMemo(() => {
    if (phase === 'export') {
      return generatePRD(sections, allQuestions, answers);
    }
    return null;
  }, [phase, sections, allQuestions, answers]);

  // Welcome screen before questions start
  if (currentIndex === 0 && Object.keys(answers).length === 0) {
    return (
      <div className="py-8">
        <WelcomeStep
          sections={sections}
          questionCounts={questionCounts}
          onStart={() => {
            /* Stay on index 0 — first question */
            setAnswer('__started', true as unknown as string);
          }}
        />
      </div>
    );
  }

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6">
      <ProgressBar
        progress={progress}
        sectionName={section?.title ?? null}
        currentIndex={currentIndex}
        totalVisible={totalVisible}
        phase={phase}
      />

      {phase === 'questions' && currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.title}</CardTitle>
            {currentQuestion.description && (
              <CardDescription>{currentQuestion.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <StepRenderer
              phase={phase}
              question={currentQuestion}
              answer={currentAnswer}
              onAnswer={(value) => setAnswer(currentQuestion.id, value)}
              sections={sections}
              allQuestions={allQuestions}
              visibleQuestions={visibleQuestions}
              answers={answers}
              onGoToQuestion={goTo}
              prd={null}
              onReset={reset}
            />
          </CardContent>
        </Card>
      )}

      {phase === 'review' && (
        <StepRenderer
          phase={phase}
          question={null}
          answer={undefined}
          onAnswer={() => {}}
          sections={sections}
          allQuestions={allQuestions}
          visibleQuestions={visibleQuestions}
          answers={answers}
          onGoToQuestion={goTo}
          prd={null}
          onReset={reset}
        />
      )}

      {phase === 'export' && (
        <StepRenderer
          phase={phase}
          question={null}
          answer={undefined}
          onAnswer={() => {}}
          sections={sections}
          allQuestions={allQuestions}
          visibleQuestions={visibleQuestions}
          answers={answers}
          onGoToQuestion={goTo}
          prd={prd}
          onReset={reset}
        />
      )}

      {/* Navigation buttons */}
      {phase !== 'export' && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prev}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {phase === 'review' ? (
            <Button onClick={next} className="gap-1">
              <Send className="h-4 w-4" />
              Generate PRD
            </Button>
          ) : (
            <Button onClick={next} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
