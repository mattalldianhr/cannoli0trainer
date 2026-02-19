'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Flame } from 'lucide-react';

interface ComplianceRingProps {
  compliance: {
    assigned: number;
    completed: number;
    streak: number;
  };
}

/**
 * SVG donut ring showing compliance percentage with a streak counter badge.
 * Shows both overall compliance rate (completed / assigned, capped at 100%)
 * and a training streak (consecutive days with a logged workout).
 */
export function ComplianceRing({ compliance }: ComplianceRingProps) {
  const { assigned, completed, streak } = compliance;

  const rate = useMemo(() => {
    if (assigned === 0) return 0;
    return Math.min(100, Math.round((completed / assigned) * 100));
  }, [assigned, completed]);

  // SVG donut ring geometry
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  // Color based on compliance rate
  const ringColor =
    rate >= 80 ? '#16a34a' : rate >= 50 ? '#f59e0b' : rate > 0 ? '#ef4444' : '#e5e7eb';

  if (assigned === 0 && completed === 0 && streak === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5" />
            Training Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Complete assigned workouts to see your compliance.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-5 w-5" />
          Training Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          {/* Donut ring */}
          <div className="relative flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="-rotate-90"
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{rate}%</span>
              <span className="text-[11px] text-muted-foreground">Compliance</span>
            </div>
          </div>

          {/* Stats column */}
          <div className="flex flex-col gap-3">
            {/* Streak badge */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight">{streak}</p>
                <p className="text-[11px] text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {/* Completed / Assigned */}
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{completed}</span> of{' '}
              <span className="font-semibold text-foreground">{assigned}</span> workouts
            </div>

            {/* Compliance badge */}
            {rate >= 80 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 w-fit">
                On Track
              </Badge>
            )}
            {rate > 0 && rate < 50 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 w-fit">
                Needs Attention
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
