import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSurveyPRD } from "@/lib/specs";

export const metadata = {
  title: "Survey PRD | S&C Research Hub",
  description:
    "Full survey PRD generated from the trainer interview with Joe Cristando / Cannoli Strength.",
};

export default function SurveyPRDPage() {
  const surveyPrd = getSurveyPRD();

  if (!surveyPrd) {
    return (
      <Container className="py-12">
        <p className="text-muted-foreground">
          No survey PRD found. Complete an interview to generate one.
        </p>
      </Container>
    );
  }

  const prdData = JSON.parse(surveyPrd.content) as {
    generatedAt: string;
    trainerProfile: Record<string, string>;
    sections: { title: string; content: string }[];
    rawAnswers: Record<string, { questionId: string; value: unknown }>;
  };

  return (
    <Container className="py-12">
      {/* Back link */}
      <Link
        href="/prd"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to PRD
      </Link>

      {/* Header */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          Survey PRD
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Trainer Interview PRD
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl">
          Generated{" "}
          {new Date(prdData.generatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          from the coaching practice interview.
        </p>
      </div>

      {/* Trainer Profile */}
      <Card className="mb-8 bg-accent/30">
        <CardHeader>
          <CardTitle className="text-lg">Trainer Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {Object.entries(prdData.trainerProfile).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <p className="mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PRD Sections */}
      <div className="space-y-6">
        {prdData.sections.map((section, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {section.content || "No data provided."}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raw Answers Section */}
      <Separator className="my-8" />
      <div>
        <h2 className="text-xl font-bold mb-4">Raw Interview Answers</h2>
        <Card>
          <CardContent className="py-4">
            <div className="space-y-3">
              {Object.entries(prdData.rawAnswers)
                .filter(([key]) => key !== "__started")
                .map(([key, answer]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium font-mono text-xs text-muted-foreground">
                      {answer.questionId}
                    </span>
                    <p className="mt-0.5">
                      {Array.isArray(answer.value)
                        ? answer.value.join(", ")
                        : String(answer.value)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
