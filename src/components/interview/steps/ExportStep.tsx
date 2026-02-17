'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PRDOutput } from '@/lib/interview/types';
import { exportAsJSON, exportAsMarkdown } from '@/lib/interview/export';
import { Download, FileText, FileJson, CheckCircle2, Loader2, CloudOff } from 'lucide-react';

interface ExportStepProps {
  prd: PRDOutput;
  onReset: () => void;
}

export function ExportStep({ prd, onReset }: ExportStepProps) {
  const submitted = useRef(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    setSubmitStatus('submitting');
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prd),
    })
      .then((res) => {
        setSubmitStatus(res.ok ? 'success' : 'error');
      })
      .catch(() => {
        setSubmitStatus('error');
      });
  }, [prd]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Interview Complete</h2>
        <p className="text-muted-foreground">
          Your requirements document has been generated. Download it below.
        </p>
        {submitStatus === 'submitting' && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving response…
          </p>
        )}
        {submitStatus === 'success' && (
          <p className="text-xs text-green-600">Response saved</p>
        )}
        {submitStatus === 'error' && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <CloudOff className="h-3 w-3" />
            Could not save — your download still works
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your PRD
          </CardTitle>
          <CardDescription>
            Choose your preferred format. Both contain the same information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            onClick={() => exportAsMarkdown(prd)}
          >
            <FileText className="h-4 w-4" />
            Download as Markdown (.md)
          </Button>
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            onClick={() => exportAsJSON(prd)}
          >
            <FileJson className="h-4 w-4" />
            Download as JSON (.json)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PRD Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prd.sections.map((section, idx) => (
            <div key={idx}>
              {idx > 0 && <Separator className="mb-4" />}
              <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content || 'No data provided.'}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={onReset}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
