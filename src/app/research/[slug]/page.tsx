import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/research/MarkdownRenderer";
import { TableOfContents } from "@/components/research/TableOfContents";
import {
  getAllResearchDocs,
  getResearchDoc,
  extractHeadings,
} from "@/lib/markdown";
import { researchMetadata } from "@/lib/research-metadata";

export function generateStaticParams() {
  return getAllResearchDocs().map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = researchMetadata[slug];
  return {
    title: meta
      ? `${meta.title} | S&C Research Hub`
      : "Research | S&C Research Hub",
    description: meta?.description,
  };
}

export default async function ResearchDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getResearchDoc(slug);
  if (!doc) notFound();

  const meta = researchMetadata[doc.slug];
  const headings = extractHeadings(doc.content);

  const allDocs = getAllResearchDocs();
  const currentIndex = allDocs.findIndex((d) => d.slug === doc.slug);
  const prev = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const next =
    currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <Container className="py-12">
      {/* Back link */}
      <Link
        href="/research"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Research Library
      </Link>

      {/* Header */}
      <div className="mb-8">
        {meta && (
          <Badge variant="secondary" className="mb-3">
            {meta.category}
          </Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {meta?.title ?? doc.slug}
        </h1>
        {meta?.description && (
          <p className="mt-3 text-muted-foreground max-w-3xl">
            {meta.description}
          </p>
        )}
        <div className="mt-3 text-sm text-muted-foreground">
          {doc.wordCount.toLocaleString()} words &middot; {doc.readingTime} min
          read
        </div>
      </div>

      {/* Mobile TOC (shown above content on small screens) */}
      {headings.length > 0 && (
        <div className="lg:hidden mb-6">
          <TableOfContents headings={headings} />
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-10">
        {/* Main content */}
        <article className="min-w-0 flex-1">
          <MarkdownRenderer content={doc.content} />
        </article>

        {/* Sidebar TOC */}
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
            href={`/research/${prev.slug}`}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <div>
              <div className="text-xs text-muted-foreground">Previous</div>
              <div className="font-medium group-hover:text-primary transition-colors">
                {researchMetadata[prev.slug]?.title ?? prev.slug}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/research/${next.slug}`}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground text-right"
          >
            <div>
              <div className="text-xs text-muted-foreground">Next</div>
              <div className="font-medium group-hover:text-primary transition-colors">
                {researchMetadata[next.slug]?.title ?? next.slug}
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
