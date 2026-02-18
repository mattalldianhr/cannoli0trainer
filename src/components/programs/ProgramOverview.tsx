import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type OverviewExercise = {
  exercise: { name: string };
  order: number;
};

type OverviewWorkout = {
  id: string;
  name: string;
  weekNumber: number;
  dayNumber: number;
  exercises: OverviewExercise[];
};

interface ProgramOverviewProps {
  weeks: [number, OverviewWorkout[]][];
}

export function ProgramOverview({ weeks }: ProgramOverviewProps) {
  if (weeks.length === 0) return null;

  // Find max days across all weeks for column count
  const maxDays = Math.max(...weeks.map(([, workouts]) => workouts.length));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 w-20">
              Week
            </th>
            {Array.from({ length: maxDays }, (_, i) => (
              <th
                key={i}
                className="text-left text-xs font-medium text-muted-foreground px-3 py-2"
              >
                Day {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map(([weekNumber, workouts]) => (
            <tr key={weekNumber} className="border-t border-border">
              <td className="px-3 py-2 align-top font-medium text-muted-foreground whitespace-nowrap">
                W{weekNumber}
              </td>
              {Array.from({ length: maxDays }, (_, dayIdx) => {
                const workout = workouts[dayIdx];
                if (!workout) {
                  return (
                    <td
                      key={dayIdx}
                      className="px-3 py-2 align-top text-muted-foreground/40"
                    >
                      —
                    </td>
                  );
                }

                const exerciseNames = workout.exercises
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 3)
                  .map((e) => e.exercise.name);
                const remaining = workout.exercises.length - exerciseNames.length;

                return (
                  <td key={dayIdx} className="px-3 py-2 align-top">
                    <a
                      href={`#week-${weekNumber}`}
                      className={cn(
                        'block rounded-md border border-border p-2 hover:bg-accent/50 transition-colors',
                        'hover:border-primary/30'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-medium text-xs truncate">
                          {workout.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                          {workout.exercises.length}
                        </Badge>
                      </div>
                      {exerciseNames.length > 0 && (
                        <div className="space-y-0.5">
                          {exerciseNames.map((name, i) => (
                            <p
                              key={i}
                              className="text-[11px] text-muted-foreground truncate leading-tight"
                            >
                              {name}
                            </p>
                          ))}
                          {remaining > 0 && (
                            <p className="text-[11px] text-muted-foreground/60 leading-tight">
                              +{remaining} more
                            </p>
                          )}
                        </div>
                      )}
                    </a>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
