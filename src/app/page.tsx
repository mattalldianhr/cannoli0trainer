import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { researchMetadata } from "@/lib/research-metadata";
import {
  BookOpen,
  ClipboardList,
  ArrowRight,
  FileText,
  Dumbbell,
  User,
} from "lucide-react";

const previewDocs = [
  "cannoli-gang-trainer-profile",
  "competitor-deep-dive",
  "teambuildr-strength-platform-comprehensive-analysis",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/50 to-background">
        <Container className="py-20 text-center space-y-6">
          <div className="flex justify-center">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            S&C Platform Research Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep research on the strength &amp; conditioning software landscape,
            a profile of the coaching practice we&apos;re building for, and an
            interactive interview to capture platform requirements and generate a PRD.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/research" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Explore Research
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/interview" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Start Interview
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Trainer Profile Callout */}
      <section className="py-12 border-b border-border">
        <Container>
          <Card className="max-w-3xl mx-auto bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Building for: Cannoli Strength</CardTitle>
                  <CardDescription>
                    Joe Cristando &mdash; Independent powerlifting &amp; S&C coach, Brooklyn NY
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2">
              <Badge variant="secondary">7 years coaching</Badge>
              <Badge variant="secondary">52 USAPL state records</Badge>
              <Badge variant="secondary">VBT practitioner</Badge>
              <Badge variant="secondary">In-person + remote</Badge>
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link href="/research/cannoli-gang-trainer-profile" className="gap-1">
                  Read full profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </Container>
      </section>

      {/* Research Preview */}
      <section className="py-16">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Research Library</h2>
              <p className="text-muted-foreground mt-1">
                {Object.keys(researchMetadata).length} in-depth research
                documents covering the S&C software market
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/research" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewDocs.map((slug) => {
              const meta = researchMetadata[slug];
              if (!meta) return null;
              return (
                <Card key={slug} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="mb-2">
                      <Badge variant="secondary">{meta.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{meta.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {meta.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/research/${slug}`} className="gap-1">
                        <FileText className="h-4 w-4" />
                        Read document
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/research" className="gap-1">
                View all research
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Interview CTA */}
      <section className="py-16 border-t border-border bg-muted/30">
        <Container>
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <ClipboardList className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Coaching Practice Interview</h2>
            <p className="text-muted-foreground">
              Walk through your coaching workflow, programming methodology,
              competition prep process, and business goals. Your answers are
              transformed into a structured PRD you can download as JSON or Markdown.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Badge variant="secondary" className="text-xs">
                ~12-18 minutes
              </Badge>
              <Badge variant="secondary" className="text-xs">
                9 sections, ~45 questions
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Auto-saved progress
              </Badge>
            </div>
            <Button size="lg" asChild className="mt-4">
              <Link href="/interview" className="gap-2">
                Begin Interview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
