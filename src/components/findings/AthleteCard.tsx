import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AthleteCardProps {
  name: string;
  id: number;
  group: string;
  dates: number;
  completionRate: number;
  tonnageKg: number;
  totalSets: number;
  totalReps: number;
  avgSessionMinutes: number;
  prCount: number;
  topExercises: { name: string; count: number }[];
  dateRange: { start: string; end: string };
}

export function AthleteCard({
  name,
  id,
  group,
  dates,
  completionRate,
  tonnageKg,
  totalSets,
  totalReps,
  avgSessionMinutes,
  prCount,
  topExercises,
  dateRange,
}: AthleteCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary" className="text-xs font-mono">
            #{id}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{group}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Dates</p>
            <p className="text-xl font-bold">{dates}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className="text-xl font-bold">{completionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">PRs</p>
            <p className="text-xl font-bold">{prCount}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Tonnage</p>
            <p className="text-sm font-semibold">{tonnageKg.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sets / Reps</p>
            <p className="text-sm font-semibold">{totalSets} / {totalReps}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Session</p>
            <p className="text-sm font-semibold">{avgSessionMinutes} min</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Date Range</p>
          <p className="text-xs font-mono">
            {dateRange.start} to {dateRange.end}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Top Exercises</p>
          <div className="flex flex-wrap gap-1">
            {topExercises.map((ex) => (
              <Badge key={ex.name} variant="outline" className="text-xs">
                {ex.name} ({ex.count})
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
