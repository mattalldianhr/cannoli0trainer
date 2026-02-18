import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchemaComparison } from "@/components/findings/SchemaComparison";
import { schemaGaps, exerciseTypes } from "@/lib/findings-data";

export default function FindingsSchemaPage() {
  const criticalCount = schemaGaps.filter((g) => g.priority === "Critical").length;
  const highCount = schemaGaps.filter((g) => g.priority === "High").length;
  const mediumCount = schemaGaps.filter((g) => g.priority === "Medium").length;

  return (
    <div className="space-y-8">
      {/* Priority Summary */}
      <div className="flex flex-wrap gap-3">
        <Badge className="text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0">
          {criticalCount} Critical
        </Badge>
        <Badge className="text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-0">
          {highCount} High
        </Badge>
        <Badge className="text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
          {mediumCount} Medium
        </Badge>
      </div>

      {/* Full Schema Gap Table */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Schema Gap Analysis</h2>
        <Card>
          <CardContent className="p-0">
            <SchemaComparison gaps={schemaGaps} />
          </CardContent>
        </Card>
      </section>

      {/* Proposed New Models */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Proposed New Models</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">WorkoutSession</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Tracks a single athlete&apos;s workout on a given date. Maps to
                TeamBuildr&apos;s per-date workout container.
              </p>
              <div className="bg-muted rounded-md p-3 text-xs font-mono space-y-1">
                <p>id: string (uuid)</p>
                <p>athleteId: string (FK)</p>
                <p>date: Date</p>
                <p>programId: string? (FK)</p>
                <p>title: string?</p>
                <p>durationSeconds: number?</p>
                <p>completionPercentage: number</p>
                <p>completedItems: number</p>
                <p>totalItems: number</p>
                <p>status: enum (NOT_STARTED, PARTIAL, COMPLETED)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">MaxSnapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Point-in-time record of an athlete&apos;s max for an exercise.
                Captures both working and generated maxes.
              </p>
              <div className="bg-muted rounded-md p-3 text-xs font-mono space-y-1">
                <p>id: string (uuid)</p>
                <p>athleteId: string (FK)</p>
                <p>exerciseId: string (FK)</p>
                <p>date: Date</p>
                <p>workingMax: number</p>
                <p>generatedMax: number?</p>
                <p>isCurrentMax: boolean</p>
                <p>source: enum (WORKOUT, MANUAL, IMPORT)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Exercise Types */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Exercise Types</h2>
        <p className="text-sm text-muted-foreground mb-4">
          TeamBuildr supports 6 exercise types. Our current spec only handles Lift.
        </p>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Example</th>
                </tr>
              </thead>
              <tbody>
                {exerciseTypes.map((type) => (
                  <tr key={type.code} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        {type.code}
                      </code>
                    </td>
                    <td className="py-3 px-4 font-medium">{type.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{type.description}</td>
                    <td className="py-3 px-4 text-muted-foreground">{type.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* New Fields */}
      <section>
        <h2 className="text-xl font-semibold mb-4">New Fields for WorkoutExercise</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Field</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">TeamBuildr Source</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { field: "supersetGroup", type: "String?", source: "groupingLetter", purpose: "Group exercises into supersets (A, B, C)" },
                  { field: "supersetColor", type: "String?", source: "groupingColorCode", purpose: "Visual color for superset grouping" },
                  { field: "isUnilateral", type: "Boolean", source: "eachSide", purpose: "Track left/right independently" },
                  { field: "restTimeSeconds", type: "Int?", source: "additionalInformation", purpose: "Rest period between sets" },
                  { field: "tempo", type: "String?", source: "additionalInformation", purpose: "Tempo prescription (e.g., 3-1-2-0)" },
                ].map((row) => (
                  <tr key={row.field} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{row.field}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{row.type}</td>
                    <td className="py-3 px-4">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{row.source}</code>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
