import Link from "next/link";
import { ArrowRight, Users, GitCompare, Server, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/findings/StatCard";
import { extractionStats, schemaGaps } from "@/lib/findings-data";

export default function FindingsOverviewPage() {
  const criticalGaps = schemaGaps.filter((g) => g.priority === "Critical").length;
  const highGaps = schemaGaps.filter((g) => g.priority === "High").length;

  return (
    <div className="space-y-8">
      {/* Extraction Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Extraction Summary</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Full extraction from account {extractionStats.accountId} covering {extractionStats.dateRange.start} to {extractionStats.dateRange.end}.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Athletes"
            value={extractionStats.athletes}
            description="All on CMM Punk group"
          />
          <StatCard
            label="Workout Dates"
            value={extractionStats.totalDates}
            description="Dates with workout data"
          />
          <StatCard
            label="Total Tonnage"
            value={`${extractionStats.totalTonnageKg.toLocaleString()} kg`}
            description="Combined volume load"
          />
          <StatCard
            label="PRs Set"
            value={extractionStats.totalPRs}
            description="In 90-day window"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="API Calls"
            value={extractionStats.apiCalls}
            description="Overview + detail + summary"
          />
          <StatCard
            label="Unique Exercises"
            value={extractionStats.uniqueExercises}
            description="All Lift type in this window"
          />
          <StatCard
            label="Total Sets"
            value={extractionStats.totalSets}
          />
          <StatCard
            label="Errors"
            value={extractionStats.errors}
            description="Zero failures"
          />
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Explore Data</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Athlete Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Per-athlete stats, completion rates, top exercises, and date ranges.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/findings/athletes" className="gap-1">
                  View athletes <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Schema Gaps</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Side-by-side comparison of TeamBuildr fields vs our spec models.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/findings/schema" className="gap-1">
                  View schema <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">API Documentation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Endpoint catalog, auth mechanism, and pagination strategy.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/findings/api" className="gap-1">
                  View API docs <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Schema Gap Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Schema Gap Summary</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalGaps}</p>
                <p className="text-xs text-muted-foreground">Critical gaps</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{highGaps}</p>
                <p className="text-xs text-muted-foreground">High priority</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{schemaGaps.length}</p>
                <p className="text-xs text-muted-foreground">Total identified</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-2">
          {schemaGaps.map((gap) => (
            <div
              key={gap.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
            >
              <span className="text-sm font-mono text-muted-foreground w-6">
                {gap.id}
              </span>
              <span className="text-sm font-medium flex-1">{gap.gap}</span>
              <Badge
                variant="outline"
                className="text-xs"
              >
                {gap.spec}
              </Badge>
              <Badge
                className={`text-xs border-0 ${
                  gap.priority === "Critical"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : gap.priority === "High"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {gap.priority}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Research Links */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Related Research</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <Link
                href="/research/teambuildr-api-exploration-findings"
                className="text-sm font-medium text-primary hover:underline"
              >
                API Exploration & Data Extraction Findings
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                Complete technical documentation of the extraction process
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Link
                href="/research/spec-review-teambuildr-data-alignment"
                className="text-sm font-medium text-primary hover:underline"
              >
                Spec Review: TeamBuildr Data Alignment
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                All 12 specs reviewed against real TeamBuildr data
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
