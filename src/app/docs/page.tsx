import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { TableOfContents } from "@/components/research/TableOfContents";
import { extractHeadings } from "@/lib/markdown";
import { getAllSpecs, getImplementationPlan, getPRD, getArchitecture } from "@/lib/specs";
import {
  FileText,
  ListChecks,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Layers,
  LayoutDashboard,
} from "lucide-react";

export const metadata = {
  title: "Docs | Cannoli Trainer",
  description:
    "Product requirements document, architecture overview, implementation plan, and technical specs for the Cannoli Trainer coaching platform.",
};

export default function DocsPage() {
  const specs = getAllSpecs();
  const plan = getImplementationPlan();
  const prd = getPRD();
  const arch = getArchitecture();

  const headings = prd ? extractHeadings(prd.content) : [];

  return (
    <>
      {/* PRD Document */}
      {prd && (
        <Container className="py-12">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-3">
              Product Requirements Document
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Cannoli Trainer PRD
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {prd.wordCount.toLocaleString()} words &middot; {prd.readingTime}{" "}
              min read
            </p>
          </div>

          {/* Mobile TOC */}
          {headings.length > 0 && (
            <div className="lg:hidden mb-6">
              <TableOfContents headings={headings} />
            </div>
          )}

          {/* Two-column layout */}
          <div className="flex gap-10">
            <article className="min-w-0 flex-1">
              <MarkdownRenderer content={prd.content} />
            </article>

            {headings.length > 0 && (
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24">
                  <TableOfContents headings={headings} />
                </div>
              </aside>
            )}
          </div>
        </Container>
      )}

      {/* Implementation Plan + Specs Section */}
      <section className="border-t border-border bg-muted/30">
        <Container className="py-12 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Architecture Card */}
            {arch && (
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Architecture Overview</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {arch.wordCount.toLocaleString()} words &middot;{" "}
                        {arch.readingTime} min read
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Full technical architecture: stack, database schema, API
                    layer, authentication, data flow, scheduling engine, VBT
                    module, and infrastructure.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      Next.js 16
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      PostgreSQL
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Prisma
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      15 models
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      30+ API routes
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/docs/architecture" className="gap-1">
                      View architecture
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Implementation Plan Card */}
            {plan && (
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Implementation Plan</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {plan.completedTasks} of {plan.totalTasks} tasks
                        completed
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${plan.totalTasks > 0 ? (plan.completedTasks / plan.totalTasks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.totalTasks > 0
                      ? `${Math.round((plan.completedTasks / plan.totalTasks) * 100)}% complete`
                      : "Not started"}{" "}
                    &middot; 12 priority tiers
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      Foundation
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      API Routes
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Athletes
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Program Builder
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Training Log
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Analytics
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      VBT
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Meet Prep
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/docs/plan" className="gap-1">
                      View full plan
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Survey Data Card */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Survey Data</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Raw interview responses from the trainer
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  The original interview captured coaching methodology,
                  pain points, must-have features, business goals, and
                  priority rankings directly from Joe Cristando. This data
                  informed the PRD above.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Badge variant="secondary" className="text-xs">
                    9 sections
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    45 questions
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    JSON + Markdown
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs/survey" className="gap-1">
                    View survey data
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Separator />

          {/* Specs Grid */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Technical Specs</h2>
                <p className="text-sm text-muted-foreground">
                  {specs.length} specs — one per feature area with requirements,
                  acceptance criteria, and test cases
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((spec) => (
                <Card
                  key={spec.slug}
                  className="flex flex-col hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5 shrink-0">
                        #{spec.number}
                      </span>
                      <CardTitle className="text-sm leading-snug">
                        {spec.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {spec.wordCount.toLocaleString()} words &middot;{" "}
                      {spec.readingTime} min read
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/docs/specs/${spec.slug}`}
                        className="gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Read spec
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
