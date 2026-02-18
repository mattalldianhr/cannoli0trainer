'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RPE_VALUES, RPE_DESCRIPTIONS, getRPETable, rpeToRIR, type RPEValue } from '@/lib/rpe-table';

interface RPEReferenceChartProps {
  /** Additional class names for the trigger button */
  className?: string;
}

/**
 * Info icon button that opens a popover with the full RPE reference chart.
 * Shows RPE descriptions and a %1RM lookup table by reps.
 */
export function RPEReferenceChart({ className }: RPEReferenceChartProps) {
  const table = getRPETable();
  const repCols = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          aria-label="RPE reference chart"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[min(95vw,32rem)] p-3"
        side="bottom"
        align="start"
      >
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">RPE Reference Chart</h4>

          {/* RPE descriptions */}
          <div className="space-y-0.5">
            {RPE_VALUES.map((rpe) => (
              <div key={rpe} className="flex items-baseline gap-2 text-xs">
                <span className="w-7 shrink-0 font-medium tabular-nums text-right">
                  {rpe}
                </span>
                <span className="text-muted-foreground">
                  {RPE_DESCRIPTIONS[rpe]} (RIR {rpeToRIR(rpe)})
                </span>
              </div>
            ))}
          </div>

          {/* %1RM table */}
          <div>
            <h5 className="mb-1 text-xs font-medium text-muted-foreground">
              Estimated %1RM by Reps
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] tabular-nums">
                <thead>
                  <tr className="border-b">
                    <th className="px-1 py-0.5 text-left font-medium">RPE</th>
                    {repCols.map((r) => (
                      <th key={r} className="px-1 py-0.5 text-center font-medium">
                        {r}r
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RPE_VALUES.map((rpe) => (
                    <tr key={rpe} className="border-b border-border/50 last:border-0">
                      <td className="px-1 py-0.5 font-medium">{rpe}</td>
                      {repCols.map((r) => (
                        <td key={r} className="px-1 py-0.5 text-center text-muted-foreground">
                          {Math.round(table[rpe][r as keyof (typeof table)[RPEValue]] * 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
