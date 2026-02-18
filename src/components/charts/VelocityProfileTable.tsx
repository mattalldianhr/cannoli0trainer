'use client';

import { cn } from '@/lib/utils';
import type { VelocityProfileRow } from '@/lib/vbt';

interface VelocityProfileTableProps {
  rows: VelocityProfileRow[];
  className?: string;
}

/**
 * Displays a velocity profile table showing average velocity at different %1RM.
 * Each row shows the %1RM, avg velocity (m/s), and sample count.
 */
export function VelocityProfileTable({ rows, className }: VelocityProfileTableProps) {
  const hasAnyData = rows.some((r) => r.avgVelocity !== null);

  if (!hasAnyData) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground text-sm py-8', className)}>
        Not enough velocity data at different loads to build a profile.
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">% 1RM</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avg Velocity</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Samples</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.percentage} className="border-b last:border-b-0">
              <td className="px-4 py-2.5 font-medium">{row.percentageLabel}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {row.avgVelocity !== null ? (
                  <span>{row.avgVelocity.toFixed(2)} m/s</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                {row.sampleCount > 0 ? row.sampleCount : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
