import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { TableOfContents } from "@/components/research/TableOfContents";
import { getImplementationPlan } from "@/lib/specs";
import { extractHeadings } from "@/lib/markdown";

export const metadata = {
  title: "Implementation Plan | S&C Research Hub",
  description:
    "Full implementation plan with 60 atomic tasks across 12 priority tiers for the Cannoli Strength coaching platform.",
};

export default function PlanPage() {
  const plan = getImplementationPlan();

  if (!plan) {
    return (
      <Container className="py-12">
        <p className="text-muted-foreground">
          No implementation plan found. Generate one first.
        </p>
      </Container>
    );
  }

  const headings = extractHeadings(plan.content);

  return (
    <Container className="py-12">
      {/* Back link */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Docs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          Implementation
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Implementation Plan
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl">
          {plan.completedTasks} of {plan.totalTasks} tasks completed across 12
          priority tiers.
        </p>
        <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden max-w-md">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${plan.totalTasks > 0 ? (plan.completedTasks / plan.totalTasks) * 100 : 0}%`,
            }}
          />
        </div>
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
          <MarkdownRenderer content={plan.content} />
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
  );
}
