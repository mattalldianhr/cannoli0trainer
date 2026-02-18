'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PreparednessResult } from '@/lib/vbt';

interface PreparednessIndicatorProps {
  result: PreparednessResult | null;
  className?: string;
}

const STATUS_CONFIG = {
  above: {
    label: 'Above Baseline',
    description: 'Velocity is higher than the 4-week rolling average — athlete is well-prepared.',
    icon: ArrowUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  at: {
    label: 'At Baseline',
    description: 'Velocity is within normal range of the 4-week rolling average.',
    icon: Minus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  below: {
    label: 'Below Baseline',
    description: 'Velocity is lower than the 4-week rolling average — consider fatigue or readiness.',
    icon: ArrowDown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
} as const;

/**
 * Displays a preparedness indicator comparing current session velocity
 * to a 4-week rolling baseline.
 */
export function PreparednessIndicator({ result, className }: PreparednessIndicatorProps) {
  if (!result) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground text-sm py-8', className)}>
        Not enough data to calculate preparedness. Log velocity across multiple sessions.
      </div>
    );
  }

  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-md border p-4', config.bgColor, config.borderColor, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 rounded-full p-1.5', config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-semibold', config.color)}>
              {config.label}
            </span>
            <span className={cn('text-sm font-medium tabular-nums', config.color)}>
              {result.percentageDiff > 0 ? '+' : ''}
              {result.percentageDiff.toFixed(1)}%
            </span>
          </div>

          <p className="text-xs text-muted-foreground">{config.description}</p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-sm font-medium tabular-nums">
                {result.currentVelocity.toFixed(3)} m/s
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">4-Week Avg</p>
              <p className="text-sm font-medium tabular-nums">
                {result.baselineVelocity.toFixed(3)} m/s
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
