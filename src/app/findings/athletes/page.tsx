import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AthleteCard } from "@/components/findings/AthleteCard";
import { StatCard } from "@/components/findings/StatCard";
import { athleteData, extractionStats, sampleWorkoutItem } from "@/lib/findings-data";

export default function FindingsAthletesPage() {
  const totalDates = athleteData.reduce((sum, a) => sum + a.dates, 0);
  const avgCompletion = Math.round(
    athleteData.reduce((sum, a) => sum + a.completionRate, 0) / athleteData.length
  );
  const totalTonnage = athleteData.reduce((sum, a) => sum + a.tonnageKg, 0);
  const totalPRs = athleteData.reduce((sum, a) => sum + a.prCount, 0);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Athletes" value={athleteData.length} />
        <StatCard label="Total Workout Dates" value={totalDates} />
        <StatCard label="Total Tonnage" value={`${totalTonnage.toLocaleString()} kg`} />
        <StatCard
          label="Unique Exercises"
          value={extractionStats.uniqueExercises}
          description={`${extractionStats.dateRange.start} to ${extractionStats.dateRange.end}`}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} />
        <StatCard label="Total PRs" value={totalPRs} />
        <StatCard label="Total Sets" value={extractionStats.totalSets} />
        <StatCard label="Total Reps" value={extractionStats.totalReps.toLocaleString()} />
      </div>

      {/* Athlete Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Athlete Profiles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athleteData.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              name={athlete.name}
              id={athlete.id}
              group={athlete.group}
              dates={athlete.dates}
              completionRate={athlete.completionRate}
              tonnageKg={athlete.tonnageKg}
              totalSets={athlete.totalSets}
              totalReps={athlete.totalReps}
              avgSessionMinutes={athlete.avgSessionMinutes}
              prCount={athlete.prCount}
              topExercises={athlete.topExercises}
              dateRange={athlete.dateRange}
            />
          ))}
        </div>
      </section>

      {/* PR History */}
      <section>
        <h2 className="text-xl font-semibold mb-4">PR History</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All {totalPRs} personal records set during the extraction window.
        </p>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Athlete</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Exercise</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Value (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteData
                    .flatMap((a) => a.prs.map((pr) => ({ ...pr, athlete: a.name })))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((pr, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-4 font-mono text-xs">{pr.date}</td>
                        <td className="py-2 px-4">{pr.athlete}</td>
                        <td className="py-2 px-4">{pr.exercise}</td>
                        <td className="py-2 px-4 text-right font-semibold">{pr.value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sample Workout Data */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Sample Workout Detail</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {sampleWorkoutItem.athlete} &middot; {sampleWorkoutItem.date} &middot; Prescribed vs actual values with max tracking.
        </p>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">{sampleWorkoutItem.exercise.name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {sampleWorkoutItem.exercise.typeDescription}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono">
                  Working max: {sampleWorkoutItem.workingMax.value} kg
                </Badge>
                {sampleWorkoutItem.generatedMax && (
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
                    New PR: {sampleWorkoutItem.generatedMax.value} kg
                  </Badge>
                )}
              </div>
            </div>
            {sampleWorkoutItem.coachNotes && (
              <p className="text-xs text-muted-foreground italic mt-1">
                Coach notes: &ldquo;{sampleWorkoutItem.coachNotes}&rdquo;
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Set</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">% of Max</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Prescribed</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Actual</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleWorkoutItem.sets.map((set) => {
                    const delta = set.actual.weight - set.prescribed.weight;
                    return (
                      <tr key={set.set} className="border-b border-border/50">
                        <td className="py-2 px-3 font-mono">{set.set}</td>
                        <td className="py-2 px-3 text-muted-foreground">{set.prescribed.percentage}%</td>
                        <td className="py-2 px-3">
                          {set.prescribed.weight} kg x {set.prescribed.reps}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {set.actual.weight} kg x {set.actual.reps}
                        </td>
                        <td className={`py-2 px-3 font-mono text-xs ${delta > 0 ? "text-green-600 dark:text-green-400" : delta < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                          {delta > 0 ? "+" : ""}{delta} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
