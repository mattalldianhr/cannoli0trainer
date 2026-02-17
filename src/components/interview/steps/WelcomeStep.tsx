'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Section } from '@/lib/interview/types';
import { ClipboardList, Clock } from 'lucide-react';

interface WelcomeStepProps {
  sections: Section[];
  questionCounts: Record<string, number>;
  onStart: () => void;
}

export function WelcomeStep({ sections, questionCounts, onStart }: WelcomeStepProps) {
  const totalQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Trainer Interview</h1>
        <p className="text-muted-foreground text-lg">
          Help us understand your needs so we can build the right S&amp;C platform for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            What to expect
          </CardTitle>
          <CardDescription>
            We will walk through {totalQuestions} questions across {sections.length} sections.
            Your answers are saved automatically so you can pick up where you left off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Estimated time: 15 - 20 minutes
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Sections:</p>
            <div className="grid gap-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span>{section.title}</span>
                  <Badge variant="secondary">
                    {questionCounts[section.id] || 0} questions
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button size="lg" onClick={onStart}>
          Start Interview
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Your progress is saved to your browser automatically. You can close this tab and resume later.
      </p>
    </div>
  );
}
