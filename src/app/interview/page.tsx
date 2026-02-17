import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { sections, questions } from '@/lib/interview/questions';
import { ClipboardList, Clock, ArrowRight, Save } from 'lucide-react';

export const metadata = {
  title: 'Trainer Interview | S&C Platform Research Hub',
  description:
    'Complete the trainer interview to help us understand your strength and conditioning needs.',
};

export default function InterviewLandingPage() {
  const questionCounts: Record<string, number> = {};
  for (const s of sections) {
    questionCounts[s.id] = questions.filter((q) => q.sectionId === s.id).length;
  }
  const totalQuestions = questions.length;

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Trainer Interview</h1>
          <p className="text-lg text-muted-foreground">
            Help us build the right strength &amp; conditioning platform by answering a
            few questions about your workflow, needs, and priorities.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Interview Overview
            </CardTitle>
            <CardDescription>
              {totalQuestions} questions across {sections.length} sections. Some questions
              are conditional and may not appear based on your earlier answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~15 - 20 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Save className="h-4 w-4" />
                Auto-saved to browser
              </span>
            </div>

            <Separator />

            <div className="space-y-1">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{section.title}</p>
                    <p className="text-muted-foreground text-xs">{section.description}</p>
                  </div>
                  <Badge variant="secondary">{questionCounts[section.id]} q</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-3">
          <Button size="lg" asChild>
            <Link href="/interview/session" className="gap-2">
              Start Interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Your progress is automatically saved to your browser. You can close the tab
            and come back anytime to pick up where you left off.
          </p>
        </div>
      </div>
    </Container>
  );
}
