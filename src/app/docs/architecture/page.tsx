import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { TableOfContents } from "@/components/research/TableOfContents";
import { getArchitecture } from "@/lib/specs";
import { extractHeadings } from "@/lib/markdown";

export const metadata = {
  title: "Architecture | Cannoli Trainer Docs",
  description:
    "Full architectural overview of the Cannoli Trainer coaching platform — stack, database schema, API layer, data flow, and infrastructure.",
};

export default function ArchitecturePage() {
  const arch = getArchitecture();

  if (!arch) {
    return (
      <Container className="py-12">
        <p className="text-muted-foreground">
          No architecture document found.
        </p>
      </Container>
    );
  }

  const headings = extractHeadings(arch.content);

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
          Architecture
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Architecture Overview
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {arch.wordCount.toLocaleString()} words &middot; {arch.readingTime}{" "}
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
          <MarkdownRenderer content={arch.content} />
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
