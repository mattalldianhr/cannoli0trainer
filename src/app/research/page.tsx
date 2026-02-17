import { Container } from "@/components/layout/Container";
import { ResearchCard } from "@/components/research/ResearchCard";
import { getAllResearchDocs } from "@/lib/markdown";
import { researchMetadata } from "@/lib/research-metadata";

export const metadata = {
  title: "Research Library | S&C Research Hub",
  description:
    "Explore competitive analyses, platform deep dives, and market research for the strength and conditioning software landscape.",
};

export default function ResearchPage() {
  const docs = getAllResearchDocs();

  return (
    <Container className="py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Research Library</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          In-depth research on the strength and conditioning software market,
          covering competitive analysis, platform capabilities, and mobile
          experiences.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => {
          const meta = researchMetadata[doc.slug];
          return (
            <ResearchCard
              key={doc.slug}
              slug={doc.slug}
              title={meta?.title ?? doc.slug}
              description={meta?.description ?? ""}
              category={meta?.category ?? "Research"}
              wordCount={doc.wordCount}
              readingTime={doc.readingTime}
            />
          );
        })}
      </div>
    </Container>
  );
}
