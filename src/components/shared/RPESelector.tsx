'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { RPE_VALUES, RPE_DESCRIPTIONS, type RPEValue } from '@/lib/rpe-table';

export interface RPESelectorProps {
  /** Current RPE value (6–10, 0.5 increments) */
  value: number | null;
  /** Called when the user selects an RPE value */
  onChange: (value: number | null) => void;
  /** Allow clearing the selection */
  allowClear?: boolean;
  /** Disable the selector */
  disabled?: boolean;
  /** Show the description text below the selector */
  showDescription?: boolean;
  /** Additional class names */
  className?: string;
}

/** Color coding for RPE values — green (easy) to red (max effort) */
function getRPEColor(rpe: number, isSelected: boolean): string {
  if (!isSelected) return 'bg-muted text-muted-foreground hover:bg-muted/80';

  if (rpe >= 10) return 'bg-red-600 text-white';
  if (rpe >= 9.5) return 'bg-red-500 text-white';
  if (rpe >= 9) return 'bg-orange-500 text-white';
  if (rpe >= 8.5) return 'bg-orange-400 text-white';
  if (rpe >= 8) return 'bg-amber-500 text-white';
  if (rpe >= 7.5) return 'bg-yellow-500 text-white';
  if (rpe >= 7) return 'bg-lime-500 text-white';
  if (rpe >= 6.5) return 'bg-green-500 text-white';
  return 'bg-green-600 text-white';
}

/**
 * RPE selector component with visual 6–10 scale (0.5 increments).
 * Used in both the program builder (prescriptions) and training log (athlete logging).
 */
export function RPESelector({
  value,
  onChange,
  allowClear = false,
  disabled = false,
  showDescription = true,
  className,
}: RPESelectorProps) {
  const handleSelect = (rpe: RPEValue) => {
    if (disabled) return;
    if (allowClear && value === rpe) {
      onChange(null);
    } else {
      onChange(rpe);
    }
  };

  const selectedDescription = value != null
    ? RPE_DESCRIPTIONS[value as RPEValue] ?? null
    : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap gap-1">
        {RPE_VALUES.map((rpe) => {
          const isSelected = value === rpe;
          return (
            <button
              key={rpe}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(rpe)}
              className={cn(
                'inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors',
                'h-8 min-w-[2.25rem] px-1.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-50',
                getRPEColor(rpe, isSelected),
              )}
              aria-label={`RPE ${rpe}`}
              aria-pressed={isSelected}
            >
              {rpe}
            </button>
          );
        })}
      </div>

      {showDescription && selectedDescription && (
        <p className="text-xs text-muted-foreground">
          RPE {value}: {selectedDescription}
        </p>
      )}
    </div>
  );
}
