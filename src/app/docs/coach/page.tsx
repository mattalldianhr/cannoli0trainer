import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { CoachDocsSidebar } from "./CoachDocsSidebar";
import { getCoachDocs } from "@/lib/specs";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Coach Guide | Cannoli Trainer",
  description:
    "Comprehensive coaching guide for Cannoli Trainer — getting started, athletes, programs, scheduling, exercises, meets, analytics, glossary, and walkthroughs.",
};

export default function CoachDocsPage() {
  const docs = getCoachDocs();

  const totalWords = docs.reduce((sum, d) => sum + d.wordCount, 0);
  const totalReadingTime = Math.max(1, Math.round(totalWords / 250));

  return (
    <Container className="py-12">
      {/* Back link */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Docs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          <BookOpen className="h-3 w-3 mr-1" />
          Coach Guide
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cannoli Trainer Coach Guide
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {docs.length} sections &middot;{" "}
          {totalWords.toLocaleString()} words &middot; {totalReadingTime} min
          read
        </p>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden mb-6">
        <CoachDocsSidebar docs={docs} />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-12">
          {docs.map((doc, i) => (
            <section key={doc.slug} id={doc.slug} className="scroll-mt-24">
              <MarkdownRenderer content={doc.content} />
              {i < docs.length - 1 && <Separator className="mt-12" />}
            </section>
          ))}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <CoachDocsSidebar docs={docs} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
