'use client';

import { cn } from '@/lib/utils';
import { rpeToRIR } from '@/lib/rpe-table';

export interface RPEWithRIRProps {
  /** RPE value (supports half-increments like 8.5) */
  rpe: number;
  /** Optional max RPE for ranges (e.g., RPE 7-8) */
  rpeMax?: number | null;
  /** Display size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * Displays RPE with its RIR equivalent inline.
 * e.g., "RPE 8 / 2 RIR" or "RPE 7-8 / 2-3 RIR"
 */
export function RPEWithRIR({ rpe, rpeMax, size = 'sm', className }: RPEWithRIRProps) {
  const rir = rpeToRIR(rpe);
  const rirMax = rpeMax != null ? rpeToRIR(rpeMax) : null;

  // Format RIR value — show decimal for half-increments
  const formatVal = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  const rpeStr = rpeMax != null ? `RPE ${rpe}-${rpeMax}` : `RPE ${rpe}`;
  // For ranges: RPE 7-8 → RIR 2-3 (lower RPE = higher RIR, so we flip the range order)
  const rirStr = rirMax != null
    ? `${formatVal(rirMax)}-${formatVal(rir)} RIR`
    : `${formatVal(rir)} RIR`;

  return (
    <span className={cn(
      'inline-flex items-center gap-1',
      size === 'sm' ? 'text-xs' : 'text-sm',
      className,
    )}>
      <span className="font-medium">{rpeStr}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{rirStr}</span>
    </span>
  );
}

/**
 * Format RPE/RIR as a plain string (for use in text-only contexts).
 * e.g., "RPE 8 / 2 RIR" or "RPE 7-8 / 2-3 RIR"
 */
export function formatRPEWithRIR(rpe: number, rpeMax?: number | null): string {
  const rir = rpeToRIR(rpe);
  const rirMax = rpeMax != null ? rpeToRIR(rpeMax) : null;

  const formatVal = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  const rpeStr = rpeMax != null ? `RPE ${rpe}-${rpeMax}` : `RPE ${rpe}`;
  const rirStr = rirMax != null
    ? `${formatVal(rirMax)}-${formatVal(rir)} RIR`
    : `${formatVal(rir)} RIR`;

  return `${rpeStr} / ${rirStr}`;
}
