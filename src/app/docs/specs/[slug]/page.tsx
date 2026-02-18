import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { TableOfContents } from "@/components/research/TableOfContents";
import { getAllSpecs, getSpec } from "@/lib/specs";
import { extractHeadings } from "@/lib/markdown";

export function generateStaticParams() {
  return getAllSpecs().map((spec) => ({ slug: spec.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = getSpec(slug);
  return {
    title: spec
      ? `${spec.title} | Specs | S&C Research Hub`
      : "Spec | S&C Research Hub",
    description: spec ? `Technical spec: ${spec.title}` : undefined,
  };
}

export default async function SpecPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = getSpec(slug);
  if (!spec) notFound();

  const headings = extractHeadings(spec.content);
  const allSpecs = getAllSpecs();
  const currentIndex = allSpecs.findIndex((s) => s.slug === spec.slug);
  const prev = currentIndex > 0 ? allSpecs[currentIndex - 1] : null;
  const next =
    currentIndex < allSpecs.length - 1 ? allSpecs[currentIndex + 1] : null;

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
          Spec #{spec.number}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {spec.title}
        </h1>
        <div className="mt-3 text-sm text-muted-foreground">
          {spec.wordCount.toLocaleString()} words &middot; {spec.readingTime}{" "}
          min read
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
          <MarkdownRenderer content={spec.content} />
        </article>

        {headings.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>

      {/* Prev/Next navigation */}
      <nav className="mt-12 flex items-center justify-between border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/docs/specs/${prev.slug}`}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <div>
              <div className="text-xs text-muted-foreground">Previous</div>
              <div className="font-medium group-hover:text-primary transition-colors">
                {prev.title}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/docs/specs/${next.slug}`}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground text-right"
          >
            <div>
              <div className="text-xs text-muted-foreground">Next</div>
              <div className="font-medium group-hover:text-primary transition-colors">
                {next.title}
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </Container>
  );
}
